"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

type CSVRow = Record<string, string>;
type ValidationError = {
  row: number;
  field: string;
  message: string;
};

type CSVUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  columns: Array<{ key: string; label: string; required?: boolean; validator?: (value: string) => string | null }>;
  onImport: (rows: CSVRow[]) => Promise<{ success: boolean; inserted: number; errors: string[] }>;
  sampleData: string;
};

export function CSVUploadDialog({
  open,
  onOpenChange,
  title,
  description,
  columns,
  onImport,
  sampleData,
}: CSVUploadDialogProps) {
  const [csvText, setCsvText] = useState("");
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Progress tracking state
  const [parsingProgress, setParsingProgress] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<"idle" | "parsing" | "uploading">("idle");
  const [totalRows, setTotalRows] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state and start parsing
    setIsParsing(true);
    setParsingStatus("parsing");
    setParsingProgress(0);
    setTotalRows(0);
    setParsedData([]);
    setValidationErrors([]);

    const parseStartTime = performance.now();
    if (process.env.NODE_ENV === "development") {
      console.log("[CSV] Parsing started", { fileName: file.name, fileSize: file.size });
    }

    // Collect data in step callback when using worker mode
    const parsedRows: CSVRow[] = [];
    let rowCount = 0;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true, // Use web worker to avoid blocking UI thread
      step: (result, parser) => {
        // Collect each row as it's parsed
        if (result.data) {
          parsedRows.push(result.data as CSVRow);
          rowCount++;
        }
        
        // Track progress: estimate based on file position
        // Note: PapaParse doesn't provide total row count in step, so we estimate
        if (result.meta && file.size > 0) {
          const currentProgress = Math.min(95, (result.meta.cursor / file.size) * 100);
          setParsingProgress(currentProgress);
        }
      },
      complete: (results) => {
        const parseEndTime = performance.now();
        const parseDuration = parseEndTime - parseStartTime;

        if (process.env.NODE_ENV === "development") {
          console.log("[CSV] Parsing completed", {
            rows: rowCount,
            duration: `${parseDuration.toFixed(2)}ms`,
            errors: results?.errors?.length || 0,
          });
        }

        setParsingProgress(100);
        setIsParsing(false);
        setTotalRows(rowCount);

        if (results?.errors && results.errors.length > 0) {
          toast.error("CSV parsing errors detected");
          console.error("CSV errors:", results.errors);
        }
        
        // Use collected data from step callback
        validateAndSetData(parsedRows);
      },
      error: (error: Error) => {
        setIsParsing(false);
        setParsingStatus("idle");
        setParsingProgress(0);
        toast.error(`Error parsing CSV: ${error.message}`);
        if (process.env.NODE_ENV === "development") {
          console.error("[CSV] Parsing error", { error: error.message });
        }
      },
    });
  };

  const handlePasteParse = () => {
    if (!csvText.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    // Reset state and start parsing
    setIsParsing(true);
    setParsingStatus("parsing");
    setParsingProgress(0);
    setTotalRows(0);
    setParsedData([]);
    setValidationErrors([]);

    const parseStartTime = performance.now();
    if (process.env.NODE_ENV === "development") {
      console.log("[CSV] Parsing started (paste mode)", { textLength: csvText.length });
    }

    // Collect data in step callback when using worker mode
    const parsedRows: CSVRow[] = [];
    let rowCount = 0;

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      worker: true, // Use web worker to avoid blocking UI thread
      step: (result, parser) => {
        // Collect each row as it's parsed
        if (result.data) {
          parsedRows.push(result.data as CSVRow);
          rowCount++;
        }
        
        // Track progress: estimate based on text position
        if (result.meta && csvText.length > 0) {
          const currentProgress = Math.min(95, (result.meta.cursor / csvText.length) * 100);
          setParsingProgress(currentProgress);
        }
      },
      complete: (results) => {
        const parseEndTime = performance.now();
        const parseDuration = parseEndTime - parseStartTime;

        if (process.env.NODE_ENV === "development") {
          console.log("[CSV] Parsing completed (paste mode)", {
            rows: rowCount,
            duration: `${parseDuration.toFixed(2)}ms`,
            errors: results?.errors?.length || 0,
          });
        }

        setParsingProgress(100);
        setIsParsing(false);
        setTotalRows(rowCount);

        if (results?.errors && results.errors.length > 0) {
          toast.error("CSV parsing errors detected");
          console.error("CSV errors:", results.errors);
        }
        
        // Use collected data from step callback
        validateAndSetData(parsedRows);
      },
      error: (error: Error) => {
        setIsParsing(false);
        setParsingStatus("idle");
        setParsingProgress(0);
        toast.error(`Error parsing CSV: ${error.message}`);
        if (process.env.NODE_ENV === "development") {
          console.error("[CSV] Parsing error (paste mode)", { error: error.message });
        }
      },
    });
  };

  const validateAndSetData = (data: CSVRow[]) => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      columns.forEach((col) => {
        const value = row[col.key]?.trim() || "";
        
        // Check required fields
        if (col.required && !value) {
          errors.push({
            row: index + 1,
            field: col.key,
            message: `${col.label} is required`,
          });
        }

        // Run custom validator
        if (value && col.validator) {
          const error = col.validator(value);
          if (error) {
            errors.push({
              row: index + 1,
              field: col.key,
              message: error,
            });
          }
        }
      });
    });

    setParsedData(data);
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      toast.warning(`Found ${errors.length} validation error(s). Please review before importing.`);
    } else {
      toast.success(`Parsed ${data.length} valid row(s)`);
    }
  };

  const getRowErrors = (rowIndex: number): ValidationError[] => {
    return validationErrors.filter((e) => e.row === rowIndex + 1);
  };

  const isValidRow = (rowIndex: number): boolean => {
    return getRowErrors(rowIndex).length === 0;
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    // Filter out invalid rows
    const validRows = parsedData.filter((_, index) => isValidRow(index));

    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    setParsingStatus("uploading");
    setParsingProgress(100); // Keep at 100% during upload

    const uploadStartTime = performance.now();
    if (process.env.NODE_ENV === "development") {
      console.log("[CSV] Upload started", { rowCount: validRows.length });
        }

    try {
      const result = await onImport(validRows);
      
      const uploadEndTime = performance.now();
      const uploadDuration = uploadEndTime - uploadStartTime;
      
      if (process.env.NODE_ENV === "development") {
        console.log("[CSV] Upload completed", {
          inserted: result.inserted,
          duration: `${uploadDuration.toFixed(2)}ms`,
        });
      }
      
      if (result.success) {
        const skipped = parsedData.length - result.inserted;
        if (skipped > 0) {
          toast.warning(`Imported ${result.inserted} row(s). ${skipped} row(s) skipped due to errors.`);
        } else {
          toast.success(`Successfully imported ${result.inserted} row(s)`);
        }
        
        // Reset and close
        handleReset();
        onOpenChange(false);
      } else {
        toast.error(`Import failed: ${result.errors.join(", ")}`);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(`Import failed: ${error.message || "Unknown error"}`);
    } finally {
      setImporting(false);
      setParsingStatus("idle");
      setParsingProgress(0);
    }
  };

  const handleReset = () => {
    setCsvText("");
    setParsedData([]);
    setValidationErrors([]);
    setUploadMode("file");
    setParsingProgress(0);
    setIsParsing(false);
    setParsingStatus("idle");
    setTotalRows(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          {(isParsing || parsingStatus === "uploading") && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {parsingStatus === "parsing" ? "Parsing CSV..." : "Uploading data..."}
                </span>
                <span className="text-muted-foreground">{Math.round(parsingProgress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${parsingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Mode Toggle */}
          <div className="flex gap-4">
            <Button
              variant={uploadMode === "file" ? "default" : "outline"}
              onClick={() => setUploadMode("file")}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
            <Button
              variant={uploadMode === "paste" ? "default" : "outline"}
              onClick={() => setUploadMode("paste")}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Paste CSV
            </Button>
          </div>

          {/* File Upload */}
          {uploadMode === "file" && (
            <div className="space-y-2">
              <Label htmlFor="csv-file">Select CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <p className="text-xs text-muted-foreground">
                Expected columns: {columns.map((c) => c.key).join(", ")}
              </p>
            </div>
          )}

          {/* Paste CSV */}
          {uploadMode === "paste" && (
            <div className="space-y-2">
              <Label htmlFor="csv-text">Paste CSV Data</Label>
              <Textarea
                id="csv-text"
                placeholder={sampleData}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Expected columns: {columns.map((c) => c.key).join(", ")}
                </p>
                <Button onClick={handlePasteParse} size="sm" variant="outline">
                  Parse CSV
                </Button>
              </div>
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview ({parsedData.length} row(s))</Label>
                <div className="flex items-center gap-2">
                  {validationErrors.length > 0 && (
                    <Badge variant="destructive">
                      {validationErrors.length} error(s)
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {parsedData.filter((_, i) => isValidRow(i)).length} valid
                  </Badge>
                </div>
              </div>
              <div className="border rounded-md max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                      <TableHead className="w-24">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => {
                      const errors = getRowErrors(index);
                      const valid = isValidRow(index);
                      
                      return (
                        <TableRow
                          key={index}
                          className={valid ? "" : "bg-destructive/10"}
                        >
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          {columns.map((col) => {
                            const value = row[col.key] || "";
                            const fieldErrors = errors.filter((e) => e.field === col.key);
                            
                            return (
                              <TableCell key={col.key}>
                                <div className="space-y-1">
                                  <span>{value || <span className="text-muted-foreground">-</span>}</span>
                                  {fieldErrors.length > 0 && (
                                    <p className="text-xs text-destructive">
                                      {fieldErrors[0].message}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            {valid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || isParsing || parsedData.length === 0 || validationErrors.length > 0}
          >
            {isParsing
              ? "Parsing CSV..."
              : importing
              ? "Uploading data..."
              : `Import ${parsedData.filter((_, i) => isValidRow(i)).length} Row(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

