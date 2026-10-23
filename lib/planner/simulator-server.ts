/**
 * Server-side simulator data fetching utilities
 * 
 * All Supabase queries for simulator (tasks and employees) happen here on the server.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Task = {
  id: string; // String to match simulation engine
  title: string;
  client: string;
  effort_hours: number;
  designation_required: string;
};

export type Employee = {
  id: string; // String to match simulation engine
  name: string;
  designation: string;
};

/**
 * Fetch all tasks for simulator, excluding ones that are already completed -
 * there's nothing left to simulate for a task that's already done.
 */
export async function fetchTasksForSimulator(): Promise<Task[]> {
  const supabase = await createServerSupabaseClient();

  const [{ data, error }, { data: completedPlans, error: plansError }] =
    await Promise.all([
      supabase.from("tasks").select("*").order("title"),
      supabase.from("plans").select("task_id").eq("is_completed", true),
    ]);

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  if (plansError) {
    console.error("Error fetching completed plans:", plansError);
  }

  const completedTaskIds = new Set(
    (completedPlans || []).map((p: { task_id: number }) => p.task_id)
  );

  return (data || [])
    .filter((task: any) => !completedTaskIds.has(task.id))
    .map((task: any) => ({
      id: String(task.id), // Convert to string to match simulation engine
      title: task.title,
      client: task.client,
      effort_hours: task.effort_hours,
      designation_required: task.designation_required,
    }));
}

/**
 * Fetch all active employees for simulator
 */
export async function fetchEmployeesForSimulator(): Promise<Employee[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Error fetching employees:", error);
    return [];
  }

  return (data || []).map((emp: any) => ({
    id: String(emp.id), // Convert to string to match simulation engine
    name: emp.name,
    designation: emp.designation,
  }));
}
