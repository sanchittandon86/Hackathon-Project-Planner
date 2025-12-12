"use client";

import { useState, useEffect, useMemo } from "react";
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

type PlanVersion = {
  id: string;
  plan_id: string;
  old_start_date: string;
  old_end_date: string;
  new_start_date: string;
  new_end_date: string;
  delta_days: number;
  generation_id?: string;
  generation_timestamp?: string;
  plan?: {
    id: string;
    task_id: string;
    employee_id: string;
    task?: {
      title: string;
      client: string;
    };
    employee?: {
      name: string;
    };
  };
};

type PlanVersionWithDetails = PlanVersion & {
  task_title: string;
  employee_name: string;
};

export default function PlanVersionsPage() {
  const [versions, setVersions] = useState<PlanVersionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupByGeneration, setGroupByGeneration] = useState(true);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/plan-versions");
      const data = await response.json();

      if (data.success) {
        console.log("Fetched versions:", data.versions);
        // Transform data to include task_title and employee_name
        // Prefer stored names (from version record) over joined data (preserves names after deletion)
        const versionsWithDetails: PlanVersionWithDetails[] = (
          data.versions || []
        ).map((version: any) => ({
          ...version,
          task_title: version.task_title || version.plan?.task?.title || "Unknown Task",
          employee_name: version.employee_name || version.plan?.employee?.name || "Unknown Employee",
        }));

        console.log("Versions with details:", versionsWithDetails);
        setVersions(versionsWithDetails);
      } else {
        console.error("Failed to fetch versions:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error fetching versions:", error);
      alert(`Error fetching versions: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

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
      return { "All": versions };
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plan Version History</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading version history...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No version history available yet. Generate a plan to see changes
              tracked here.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedVersions).map(([genId, genVersions]) => (
                <div key={genId} className="space-y-4">
                  {groupByGeneration && genId !== "All" && (
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="text-lg font-semibold">Generation</h3>
                        {genVersions[0]?.generation_timestamp && (
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(genVersions[0].generation_timestamp)}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {genVersions.length} change{genVersions.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Old Start Date</TableHead>
                        <TableHead>Old End Date</TableHead>
                        <TableHead>New Start Date</TableHead>
                        <TableHead>New End Date</TableHead>
                        <TableHead className="text-right">Δ Days</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {genVersions.map((version) => (
                        <TableRow key={version.id}>
                          <TableCell className="font-medium">
                            {version.task_title}
                          </TableCell>
                          <TableCell>{version.employee_name}</TableCell>
                          <TableCell>{formatDate(version.old_start_date)}</TableCell>
                          <TableCell>{formatDate(version.old_end_date)}</TableCell>
                          <TableCell>{formatDate(version.new_start_date)}</TableCell>
                          <TableCell>{formatDate(version.new_end_date)}</TableCell>
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

