/**
 * Server-side planner data fetching utilities
 * 
 * All Supabase queries for plans with joins happen here on the server.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Plan = {
  id: number;
  task_id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  total_hours: number;
  is_overdue?: boolean;
  days_overdue?: number;
  is_completed?: boolean;
  completed_at?: string | null;
  completion_type?: "on_time" | "late" | null;
};

export type PlanWithDetails = Plan & {
  task_title: string;
  task_client: string;
  employee_name: string;
  task_due_date?: string | null;
};

export type RecalculationStatus = {
  needsRecalculation: boolean;
};

/**
 * Fetch all plans with task and employee details
 */
export async function fetchPlans(): Promise<PlanWithDetails[]> {
  console.log("[PLANNER:BE] fetchPlans - Fetching plans with details");
  const supabase = createServerSupabaseClient();

  // Fetch plans with joined task and employee data
  const { data: plansData, error: plansError } = await supabase
    .from("plans")
    .select(
      `
      *,
      task:tasks(title, client, due_date),
      employee:employees(name)
    `
    )
    .order("start_date", { ascending: true });

  if (plansError) {
    console.error("[PLANNER:BE] fetchPlans - Error fetching plans", {
      error: plansError.message,
    });
    return [];
  }

  if (!plansData || plansData.length === 0) {
    console.log("[PLANNER:BE] fetchPlans - No plans found");
    return [];
  }

  console.log("[PLANNER:BE] fetchPlans - Success", {
    planCount: plansData.length,
  });

  // Transform data to include task_title, task_client, employee_name, and due_date
  const plansWithDetails: PlanWithDetails[] = plansData.map((plan: any) => ({
    id: plan.id,
    task_id: plan.task_id,
    employee_id: plan.employee_id,
    start_date: plan.start_date,
    end_date: plan.end_date,
    total_hours: plan.total_hours,
    is_overdue: plan.is_overdue || false,
    days_overdue: plan.days_overdue || 0,
    is_completed: plan.is_completed || false,
    completed_at: plan.completed_at || null,
    completion_type: plan.completion_type || null,
    task_title: plan.task?.title || "Unknown Task",
    task_client: plan.task?.client || "Unknown Client",
    employee_name: plan.employee?.name || "Unknown Employee",
    task_due_date: plan.task?.due_date || null,
  }));

  return plansWithDetails;
}

/**
 * Check if plan recalculation is needed
 * Compares last_updated timestamps from master data vs plans
 */
export async function checkRecalculationNeeded(): Promise<RecalculationStatus> {
  console.log("[PLANNER:BE] checkRecalculationNeeded - Checking if recalculation is needed");
  const supabase = createServerSupabaseClient();

  try {
    // Get max last_updated from master data tables
    const [employeesResult, tasksResult, leavesResult, plansResult] =
      await Promise.all([
        supabase
          .from("employees")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1),
        supabase
          .from("tasks")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1),
        supabase
          .from("leaves")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1),
        supabase
          .from("plans")
          .select("last_updated")
          .order("last_updated", { ascending: false })
          .limit(1),
      ]);

    const employeesMax =
      employeesResult.data?.[0]?.last_updated || null;
    const tasksMax = tasksResult.data?.[0]?.last_updated || null;
    const leavesMax = leavesResult.data?.[0]?.last_updated || null;
    const plansMax = plansResult.data?.[0]?.last_updated || null;

    // Find the latest master data update
    const masterDates = [
      employeesMax,
      tasksMax,
      leavesMax,
    ].filter(Boolean) as string[];

    if (masterDates.length === 0) {
      // No master data yet, no need to recalculate
      console.log("[PLANNER:BE] checkRecalculationNeeded - No master data, no recalculation needed");
      return { needsRecalculation: false };
    }

    const latestMasterUpdate = new Date(
      Math.max(...masterDates.map((d) => new Date(d).getTime()))
    );

    // Compare with plans update
    if (!plansMax) {
      // Plans don't exist, but master data does - needs recalculation
      console.log("[PLANNER:BE] checkRecalculationNeeded - Plans don't exist, recalculation needed", {
        latestMasterUpdate: latestMasterUpdate.toISOString(),
      });
      return { needsRecalculation: true };
    }

    const plansUpdate = new Date(plansMax);

    // If master data is newer than plans, show alert
    const needsRecalculation = latestMasterUpdate > plansUpdate;
    console.log("[PLANNER:BE] checkRecalculationNeeded - Comparison result", {
      latestMasterUpdate: latestMasterUpdate.toISOString(),
      plansUpdate: plansUpdate.toISOString(),
      needsRecalculation,
    });
    return {
      needsRecalculation,
    };
  } catch (error) {
    console.error("[PLANNER:BE] checkRecalculationNeeded - Error checking recalculation", {
      error,
    });
    return { needsRecalculation: false };
  }
}
