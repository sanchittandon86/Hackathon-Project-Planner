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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("CSV parsing errors detected");
          console.error("CSV errors:", results.errors);
        }
        validateAndSetData(results.data as CSVRow[]);
      },
      error: (error: Error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
      },
    });
  };

  const handlePasteParse = () => {
    if (!csvText.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("CSV parsing errors detected");
          console.error("CSV errors:", results.errors);
        }
        validateAndSetData(results.data as CSVRow[]);
      },
      error: (error: Error) => {
        toast.error(`Error parsing CSV: ${error.message}`);
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
    try {
      const result = await onImport(validRows);
      
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
    }
  };

  const handleReset = () => {
    setCsvText("");
    setParsedData([]);
    setValidationErrors([]);
    setUploadMode("file");
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
            disabled={importing || parsedData.length === 0 || validationErrors.length > 0}
          >
            {importing ? "Importing..." : `Import ${parsedData.filter((_, i) => isValidRow(i)).length} Row(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

