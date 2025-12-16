/**
 * Server-side leave data fetching utilities
 * 
 * All Supabase queries for leaves and employees happen here on the server.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type Employee = {
  id: string;
  name: string;
  designation: string;
};

export type Leave = {
  id: number;
  employee_id: string;
  leave_date: string;
};

export type LeaveWithEmployee = Leave & {
  employee_name: string;
};

/**
 * Fetch all employees from the database
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log("[LEAVES:FETCH] Starting fetchEmployees()");
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name");

  if (error) {
    console.error("[LEAVES:FETCH] Error fetching employees:", error);
    return [];
  }

  const count = data?.length || 0;
  console.log(`[LEAVES:FETCH] Successfully fetched ${count} employees`);
  return (data || []).map((emp) => ({
    id: emp.id,
    name: emp.name,
    designation: emp.designation,
  }));
}

/**
 * Fetch all leaves with employee names
 */
export async function fetchLeaves(): Promise<LeaveWithEmployee[]> {
  console.log("[LEAVES:FETCH] Starting fetchLeaves()");
  const supabase = createServerSupabaseClient();

  // Fetch leaves with employee names using join
  const { data, error } = await supabase
    .from("leaves")
    .select("*, employees(name)")
    .order("leave_date", { ascending: false });

  if (error) {
    console.error("[LEAVES:FETCH] Error fetching leaves:", error);
    return [];
  }

  // Transform data to include employee_name
  const leavesWithNames: LeaveWithEmployee[] = (data || []).map((leave: any) => ({
    id: leave.id,
    employee_id: leave.employee_id,
    leave_date: leave.leave_date,
    employee_name: leave.employees?.name || "Unknown Employee",
  }));

  const count = leavesWithNames.length;
  console.log(`[LEAVES:FETCH] Successfully fetched ${count} leaves`);
  return leavesWithNames;
}
