/**
 * Server-side task data fetching utilities
 * 
 * All Supabase queries for tasks happen here on the server.
 */

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Task } from "@/types/database";

export type TaskWithCompletion = Task & { is_completed: boolean };

/**
 * Fetch all tasks from the database, along with whether each one has a
 * completed plan (so the UI can lock completed tasks from editing/deletion).
 */
export async function fetchTasks(): Promise<TaskWithCompletion[]> {
  console.log("[TASKS:FETCH] Starting fetchTasks()");
  const supabase = await createServerSupabaseClient();

  const [{ data, error }, { data: completedPlans, error: plansError }] =
    await Promise.all([
      supabase.from("tasks").select("*").order("client", { ascending: true }),
      supabase.from("plans").select("task_id").eq("is_completed", true),
    ]);

  if (error) {
    console.error("[TASKS:FETCH] Error fetching tasks:", error);
    // Return empty array on error to prevent page crash
    return [];
  }

  if (plansError) {
    console.error(
      "[TASKS:FETCH] Error fetching completed plans:",
      plansError
    );
  }

  const completedTaskIds = new Set(
    (completedPlans || []).map((p: { task_id: number }) => p.task_id)
  );

  const count = data?.length || 0;
  console.log(`[TASKS:FETCH] Successfully fetched ${count} tasks`);
  return (data || []).map((task) => ({
    ...task,
    is_completed: completedTaskIds.has(task.id),
  }));
}
