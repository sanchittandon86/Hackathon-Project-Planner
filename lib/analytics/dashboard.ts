/**
 * Server-side dashboard analytics data fetching
 * 
 * All Supabase queries and data aggregation happen here on the server.
 * This ensures no Supabase client code is shipped to the browser.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DashboardAnalytics } from "@/types/dashboard";
import { formatDateLocal } from "@/lib/utils";

export async function fetchDashboardAnalytics(): Promise<DashboardAnalytics> {
  const supabase = createServerSupabaseClient();

  // Calculate date ranges for leaves query
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  const todayISO = formatDateLocal(today);
  const thirtyDaysISO = formatDateLocal(thirtyDaysFromNow);

  // Calculate today for task completion stats
  const todayForCompletion = new Date();
  todayForCompletion.setHours(0, 0, 0, 0);

  // Execute all queries in parallel for better performance
  const [
    employeesResult,
    tasksResult,
    tasksDataResult,
    leavesResult,
    plansDataResult,
    overdueResult,
    allPlansResult,
  ] = await Promise.all([
    // 1. Total Employees
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("active", true),

    // 2. Total Tasks
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true }),

    // 3. Tasks per Client (need full data for aggregation)
    supabase
      .from("tasks")
      .select("client"),

    // 4. Upcoming Leaves (next 30 days)
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .gte("leave_date", todayISO)
      .lte("leave_date", thirtyDaysISO),

    // 5. Workload Distribution (from plans with employee join)
    supabase
      .from("plans")
      .select("employee_id, total_hours, employee:employees(name)"),

    // 6. Overdue Tasks (from plans)
    supabase
      .from("plans")
      .select("*", { count: "exact", head: true })
      .eq("is_overdue", true),

    // 7. Task Completion Stats (from plans)
    supabase
      .from("plans")
      .select("is_completed, start_date, end_date"),
  ]);

  // Handle errors gracefully
  if (employeesResult.error) {
    console.error("Error fetching employees:", employeesResult.error);
  }
  if (tasksResult.error) {
    console.error("Error fetching tasks:", tasksResult.error);
  }
  if (tasksDataResult.error) {
    console.error("Error fetching tasks data:", tasksDataResult.error);
  }
  if (leavesResult.error) {
    console.error("Error fetching leaves:", leavesResult.error);
  }
  if (plansDataResult.error) {
    console.error("Error fetching plans data:", plansDataResult.error);
  }
  if (overdueResult.error) {
    console.error("Error fetching overdue tasks:", overdueResult.error);
  }
  if (allPlansResult.error) {
    console.error("Error fetching all plans:", allPlansResult.error);
  }

  // 3. Aggregate Tasks per Client (server-side)
  const clientCounts: Record<string, number> = {};
  tasksDataResult.data?.forEach((task) => {
    if (task.client) {
      clientCounts[task.client] = (clientCounts[task.client] || 0) + 1;
    }
  });
  const tasksPerClient = Object.entries(clientCounts).map(([name, value]) => ({
    name,
    value,
  }));

  // 5. Aggregate Workload Distribution (server-side)
  const workloadMap: Record<string, { name: string; hours: number }> = {};
  plansDataResult.data?.forEach((plan: any) => {
    const empId = plan.employee_id;
    const empName = plan.employee?.name || "Unknown";
    if (!workloadMap[empId]) {
      workloadMap[empId] = { name: empName, hours: 0 };
    }
    workloadMap[empId].hours += plan.total_hours || 0;
  });
  const workloadDistribution = Object.values(workloadMap).sort(
    (a, b) => b.hours - a.hours
  );

  // 7. Calculate Task Completion Stats (server-side)
  let completedCount = 0;
  let inProgressCount = 0;
  let notStartedCount = 0;

  allPlansResult.data?.forEach((plan: any) => {
    if (plan.is_completed) {
      completedCount++;
    } else {
      const startDate = new Date(plan.start_date);
      startDate.setHours(0, 0, 0, 0);
      if (startDate > todayForCompletion) {
        notStartedCount++;
      } else {
        inProgressCount++;
      }
    }
  });

  // Return aggregated analytics data
  return {
    totalEmployees: employeesResult.count || 0,
    totalTasks: tasksResult.count || 0,
    tasksPerClient,
    upcomingLeaves: leavesResult.count || 0,
    workloadDistribution,
    overdueTasks: overdueResult.count || 0,
    completedTasks: completedCount,
    inProgressTasks: inProgressCount,
    notStartedTasks: notStartedCount,
  };
}
