"use server";

/**
 * Server Actions for planner mutations
 * 
 * All database write operations happen here.
 * These actions are called from client components but execute on the server.
 */

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get today's date in local timezone (YYYY-MM-DD format)
 * Uses local timezone methods to avoid UTC conversion issues
 */
function getTodayLocal(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mark a plan as completed
 */
export async function markPlanCompleted(
  planId: number
): Promise<ActionResult> {
  console.log("[PLANNER:BE] markPlanCompleted - Called", { planId });
  try {
    if (!planId) {
      console.log("[PLANNER:BE] markPlanCompleted - Validation failed: missing planId");
      return {
        success: false,
        error: "plan_id is required",
      };
    }

    const supabase = createServerSupabaseClient();

    // First, fetch the plan with task details to get due_date
    console.log("[PLANNER:BE] markPlanCompleted - Fetching plan with task details", { planId });
    const { data: planData, error: fetchError } = await supabase
      .from("plans")
      .select(`
        *,
        task:tasks(due_date)
      `)
      .eq("id", planId)
      .single();

    if (fetchError || !planData) {
      console.error("[PLANNER:BE] markPlanCompleted - Error fetching plan", {
        planId,
        error: fetchError,
      });
      return {
        success: false,
        error: "Plan not found",
      };
    }

    const taskDueDate = (planData.task as any)?.due_date || null;
    const endDate = getTodayLocal(); // Current date in local timezone (YYYY-MM-DD format)
    
    // Compare endDate (current date) with dueDate to determine completion type
    let completionType: "on_time" | "late" = "on_time";
    
    if (taskDueDate) {
      const dueDate = new Date(taskDueDate);
      const completionDate = new Date(endDate);
      
      // Set time to midnight for accurate date comparison
      dueDate.setHours(0, 0, 0, 0);
      completionDate.setHours(0, 0, 0, 0);
      
      if (completionDate > dueDate) {
        completionType = "late";
      }
    }

    console.log("[PLANNER:BE] markPlanCompleted - Completion analysis", {
      planId,
      taskId: planData.task_id,
      employeeId: planData.employee_id,
      dueDate: taskDueDate,
      endDate,
      completionType,
      oldEndDate: planData.end_date,
      updatingEndDate: true,
    });

    // Update the plan to mark it as completed with completion type and update end_date
    console.log("[PLANNER:BE] markPlanCompleted - Updating plan with completion status", {
      planId,
      completionType,
      endDate,
    });
    const { error } = await supabase
      .from("plans")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completion_type: completionType,
        end_date: endDate, // Update end_date to actual completion date
      })
      .eq("id", planId);

    if (error) {
      console.error("[PLANNER:BE] markPlanCompleted - Supabase error", {
        planId,
        error: error.message,
      });
      return {
        success: false,
        error: error.message || "Failed to mark plan as completed",
      };
    }

    // Revalidate the planner page to show updated data
    revalidatePath("/planner");
    console.log("[PLANNER:BE] markPlanCompleted - Success, revalidated path", {
      planId,
      completionType,
      endDate,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[PLANNER:BE] markPlanCompleted - Unexpected error", {
      planId,
      error: error.message,
    });
    return {
      success: false,
      error: error.message || "Failed to mark plan as completed",
    };
  }
}
