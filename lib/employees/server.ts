/**
 * Server-side employee data fetching utilities
 * 
 * All Supabase queries for employees happen here on the server.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Employee } from "@/types/database";

/**
 * Fetch all employees from the database
 */
export async function fetchEmployees(): Promise<Employee[]> {
  console.log("[EMPLOYEES:FETCH] Starting fetchEmployees()");
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("[EMPLOYEES:FETCH] Error fetching employees:", error);
    // Return empty array on error to prevent page crash
    return [];
  }

  const count = data?.length || 0;
  console.log(`[EMPLOYEES:FETCH] Successfully fetched ${count} employees`);
  return data || [];
}
