/**
 * Server-side task data fetching utilities
 * 
 * All Supabase queries for tasks happen here on the server.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Task } from "@/types/database";

/**
 * Fetch all tasks from the database
 */
export async function fetchTasks(): Promise<Task[]> {
  console.log("[TASKS:FETCH] Starting fetchTasks()");
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("client", { ascending: true });

  if (error) {
    console.error("[TASKS:FETCH] Error fetching tasks:", error);
    // Return empty array on error to prevent page crash
    return [];
  }

  const count = data?.length || 0;
  console.log(`[TASKS:FETCH] Successfully fetched ${count} tasks`);
  return data || [];
}
