"use client";

/**
 * Client component for plan versions page UI
 * 
 * This component handles all interactive UI elements:
 * - Table rendering
 * - Sorting
 * - Filtering
 * - Grouping by generation
 * - Memoized derived views
 * 
 * It does NOT perform direct database operations.
 * All data is received as props from the Server Component.
 */

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { PlanVersionWithDetails } from "@/lib/planner/versions-server";

type VersionsClientProps = {
  initialVersions: PlanVersionWithDetails[];
};

export default function VersionsClient({
  initialVersions,
}: VersionsClientProps) {
  const [versions, setVersions] = useState<PlanVersionWithDetails[]>(
    initialVersions
  );
  const [groupByGeneration, setGroupByGeneration] = useState(true);

  // Update local state when initial data changes (after refresh)
  useEffect(() => {
    console.log("[VERSIONS:FE] useEffect - Initial versions data updated", {
      versionCount: initialVersions.length,
    });
    setVersions(initialVersions);
  }, [initialVersions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group versions by generation_id
  const groupedVersions = useMemo(() => {
    if (!groupByGeneration) {
      console.log("[VERSIONS:FE] Grouped versions - Not grouping by generation", {
        totalVersions: versions.length,
      });
      return { All: versions };
    }

    const groups: Record<string, PlanVersionWithDetails[]> = {};
    versions.forEach((version) => {
      const genId = version.generation_id || "unknown";
      if (!groups[genId]) {
        groups[genId] = [];
      }
      groups[genId].push(version);
    });

    // Sort groups by generation timestamp (newest first)
    const sortedGroups: Record<string, PlanVersionWithDetails[]> = {};
    Object.entries(groups)
      .sort((a, b) => {
        const timeA = a[1][0]?.generation_timestamp || "";
        const timeB = b[1][0]?.generation_timestamp || "";
        return timeB.localeCompare(timeA);
      })
      .forEach(([key, value]) => {
        sortedGroups[key] = value;
      });

    console.log("[VERSIONS:FE] Grouped versions - Grouped by generation", {
      totalVersions: versions.length,
      groupCount: Object.keys(sortedGroups).length,
    });
    return sortedGroups;
  }, [versions, groupByGeneration]);

  const getDeltaBadge = (deltaDays: number) => {
    if (deltaDays > 0) {
      return (
        <Badge variant="destructive" className="font-semibold">
          +{deltaDays} days
        </Badge>
      );
    } else if (deltaDays < 0) {
      return (
        <Badge
          variant="default"
          className="bg-green-600 hover:bg-green-700 font-semibold"
        >
          {deltaDays} days
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="font-semibold">
          No change
        </Badge>
      );
    }
  };

  const exportToExcel = () => {
    console.log("[VERSIONS:FE] exportToExcel - Exporting version history to Excel", {
      versionCount: versions.length,
    });

    // Prepare data for Excel export
    const excelData = versions.map((version) => ({
      "Task Title": version.task_title || "Unknown Task",
      "Employee Name": version.employee_name || "Unknown Employee",
      "Old Start Date": version.old_start_date || "-",
      "Old End Date": version.old_end_date || "-",
      "New Start Date": version.new_start_date || "-",
      "New End Date": version.new_end_date || "-",
      "Delta Days": version.delta_days,
      "Generation ID": version.generation_id || "-",
      "Generation Timestamp": version.generation_timestamp
        ? formatDateTime(version.generation_timestamp)
        : "-",
    }));

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Version History");

    // Set column widths for better readability
    const columnWidths = [
      { wch: 30 }, // Task Title
      { wch: 20 }, // Employee Name
      { wch: 15 }, // Old Start Date
      { wch: 15 }, // Old End Date
      { wch: 15 }, // New Start Date
      { wch: 15 }, // New End Date
      { wch: 12 }, // Delta Days
      { wch: 40 }, // Generation ID
      { wch: 25 }, // Generation Timestamp
    ];
    worksheet["!cols"] = columnWidths;

    // Generate Excel file and trigger download
    const fileName = `version-history-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    console.log("[VERSIONS:FE] exportToExcel - Excel file downloaded", {
      fileName,
      rowCount: excelData.length,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl sm:text-2xl">Plan Version History</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="groupByGeneration"
                  checked={groupByGeneration}
                  onChange={(e) => setGroupByGeneration(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="groupByGeneration"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Group by generation
                </label>
              </div>
              <Button
                onClick={exportToExcel}
                variant="outline"
                size="sm"
                disabled={versions.length === 0}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No version history available yet. Generate a plan to see changes
              tracked here.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedVersions).map(([genId, genVersions]) => (
                <div key={genId} className="space-y-4">
                  {groupByGeneration && genId !== "All" && (
                    <div className="flex items-center justify-between border-b pb-2 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Generation</h3>
                        {genVersions[0]?.generation_timestamp && (
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(genVersions[0].generation_timestamp)}
                          </p>
                        )}
                        {genVersions[0]?.generation_id && (
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            ID: {genVersions[0].generation_id.substring(0, 8)}
                            ...
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">
                          {genVersions.length} change
                          {genVersions.length !== 1 ? "s" : ""}
                        </Badge>
                        {genVersions.some((v) => v.delta_days > 0) && (
                          <Badge variant="destructive" className="text-xs">
                            {
                              genVersions.filter((v) => v.delta_days > 0).length
                            }{" "}
                            delayed
                          </Badge>
                        )}
                        {genVersions.some((v) => v.delta_days < 0) && (
                          <Badge
                            variant="default"
                            className="bg-green-600 text-xs"
                          >
                            {
                              genVersions.filter((v) => v.delta_days < 0).length
                            }{" "}
                            improved
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Old Start</TableHead>
                        <TableHead>Old End</TableHead>
                        <TableHead>New Start</TableHead>
                        <TableHead>New End</TableHead>
                        <TableHead className="text-right">Δ Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {genVersions
                        .sort((a, b) => {
                          // Sort by task title, then by employee name
                          const taskCompare = (a.task_title || "").localeCompare(
                            b.task_title || ""
                          );
                          if (taskCompare !== 0) return taskCompare;
                          return (a.employee_name || "").localeCompare(
                            b.employee_name || ""
                          );
                        })
                        .map((version) => (
                          <TableRow key={version.id}>
                            <TableCell className="font-medium">
                              {version.task_title || "Unknown Task"}
                            </TableCell>
                            <TableCell>
                              {version.employee_name || "Unknown Employee"}
                            </TableCell>
                            <TableCell>
                              {version.old_start_date
                                ? formatDate(version.old_start_date)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {version.old_end_date
                                ? formatDate(version.old_end_date)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {version.new_start_date
                                ? formatDate(version.new_start_date)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {version.new_end_date
                                ? formatDate(version.new_end_date)
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {getDeltaBadge(version.delta_days)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
