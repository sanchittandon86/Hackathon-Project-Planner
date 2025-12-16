/**
 * Server-side plan versions data fetching utilities
 * 
 * All Supabase queries for plan versions happen here on the server.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PlanVersion = {
  id: string;
  plan_id: string | null;
  task_id: string;
  employee_id: string;
  employee_name: string;
  task_title: string;
  old_start_date: string;
  old_end_date: string;
  new_start_date: string;
  new_end_date: string;
  delta_days: number;
  generation_id?: string;
  generation_timestamp?: string;
  plan?: {
    task_id: string;
    employee_id: string;
    task?: {
      title: string;
      client: string | null;
    };
    employee?: {
      name: string;
    };
  };
};

export type PlanVersionWithDetails = PlanVersion & {
  task_title: string;
  employee_name: string;
};

/**
 * Fetch all plan versions with task and employee details
 * 
 * Returns versions ordered by generation timestamp (newest first), then by id.
 */
export async function fetchPlanVersions(): Promise<PlanVersionWithDetails[]> {
  console.log("[VERSIONS:BE] fetchPlanVersions - Fetching plan versions");
  const supabase = createServerSupabaseClient();

  try {
    // Fetch all plan versions, ordered by generation timestamp (newest first), then by id
    const { data: versions, error: versionsError } = await supabase
      .from("plan_versions")
      .select("*")
      .order("generation_timestamp", { ascending: false })
      .order("id", { ascending: false });

    if (versionsError) {
      console.error("[VERSIONS:BE] fetchPlanVersions - Error fetching versions", {
        error: versionsError.message,
      });
      return [];
    }

    if (!versions || versions.length === 0) {
      console.log("[VERSIONS:BE] fetchPlanVersions - No versions found");
      return [];
    }

    console.log("[VERSIONS:BE] fetchPlanVersions - Versions fetched", {
      versionCount: versions.length,
    });

    // Check if task_id and employee_id columns exist
    const hasTaskIdColumn = versions.some((v: any) =>
      v.hasOwnProperty("task_id")
    );
    const hasEmployeeIdColumn = versions.some((v: any) =>
      v.hasOwnProperty("employee_id")
    );

    // If columns don't exist, return versions with stored names only
    if (!hasTaskIdColumn || !hasEmployeeIdColumn) {
      console.warn("[VERSIONS:BE] fetchPlanVersions - Missing columns, using stored names only", {
        hasTaskIdColumn,
        hasEmployeeIdColumn,
        versionCount: versions.length,
      });
      return versions.map((version: any) => ({
        ...version,
        task_id: version.task_id || "",
        employee_id: version.employee_id || "",
        task_title:
          version.task_title || version.plan?.task?.title || "Unknown Task",
        employee_name:
          version.employee_name ||
          version.plan?.employee?.name ||
          "Unknown Employee",
        plan: {
          task_id: version.task_id || "",
          employee_id: version.employee_id || "",
          task: null,
          employee: null,
        },
      }));
    }

    // Get unique task_ids and employee_ids to fetch details
    const taskIds = [
      ...new Set(versions.map((v: any) => v.task_id).filter(Boolean)),
    ];
    const employeeIds = [
      ...new Set(versions.map((v: any) => v.employee_id).filter(Boolean)),
    ];

    console.log("[VERSIONS:BE] fetchPlanVersions - Fetching task and employee details", {
      uniqueTaskIds: taskIds.length,
      uniqueEmployeeIds: employeeIds.length,
    });

    // Fetch tasks and employees in parallel
    const [tasksResult, employeesResult] = await Promise.all([
      taskIds.length > 0
        ? supabase
            .from("tasks")
            .select("id, title, client")
            .in("id", taskIds)
        : Promise.resolve({ data: [], error: null }),
      employeeIds.length > 0
        ? supabase
            .from("employees")
            .select("id, name")
            .in("id", employeeIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Create maps for quick lookup
    const tasksMap = new Map();
    tasksResult.data?.forEach((task: any) => {
      tasksMap.set(task.id, task);
    });

    const employeesMap = new Map();
    employeesResult.data?.forEach((employee: any) => {
      employeesMap.set(employee.id, employee);
    });

    // Combine versions with task and employee data
    const versionsWithDetails: PlanVersionWithDetails[] = versions.map(
      (version: any) => {
        const taskId = version.task_id;
        const employeeId = version.employee_id;

        // Use stored names if available (preserves names even after deletion),
        // otherwise fetch from maps
        const employeeName =
          version.employee_name ||
          employeesMap.get(employeeId)?.name ||
          "Unknown Employee";
        const taskTitle =
          version.task_title || tasksMap.get(taskId)?.title || "Unknown Task";

        return {
          ...version,
          task_id: taskId,
          employee_id: employeeId,
          task_title: taskTitle,
          employee_name: employeeName,
          plan: {
            task_id: taskId,
            employee_id: employeeId,
            task: tasksMap.get(taskId) || { title: taskTitle, client: null },
            employee:
              employeesMap.get(employeeId) || { name: employeeName },
          },
        };
      }
    );

    console.log("[VERSIONS:BE] fetchPlanVersions - Success", {
      versionCount: versionsWithDetails.length,
    });
    return versionsWithDetails;
  } catch (error) {
    console.error("[VERSIONS:BE] fetchPlanVersions - Unexpected error", {
      error,
    });
    return [];
  }
}
