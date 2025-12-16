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
 * Fetch all tasks for simulator
 */
export async function fetchTasksForSimulator(): Promise<Task[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("title");

  if (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }

  return (data || []).map((task: any) => ({
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
  const supabase = createServerSupabaseClient();

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
