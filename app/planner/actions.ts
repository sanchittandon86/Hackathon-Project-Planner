"use server";

/**
 * Server Actions for planner mutations
 * 
 * All database write operations happen here.
 * These actions are called from client components but execute on the server.
 */

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";

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

type QaHandoffResult = {
  qaTaskCreated: boolean;
  noQaInOrg: boolean;
};

/**
 * If a completed task required a Developer, clone it into a new QA task
 * (same client/title/effort/due date, designation_required = "QA") so the
 * work flows on to QA next. If no active QA employee exists yet, the task
 * is still created - it'll just sit unscheduled until one is added, and the
 * caller is told via noQaInOrg so the UI can surface that.
 */
async function handleDeveloperCompletionHandoff(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  task: {
    title: string;
    client: string;
    effort_hours: number;
    designation_required: string;
    due_date: string | null;
  }
): Promise<QaHandoffResult> {
  if (task.designation_required !== "Developer") {
    return { qaTaskCreated: false, noQaInOrg: false };
  }

  const { data: qaEmployees } = await supabase
    .from("employees")
    .select("id")
    .eq("designation", "QA")
    .eq("active", true)
    .limit(1);

  const noQaInOrg = !qaEmployees || qaEmployees.length === 0;

  const { error: insertError } = await supabase.from("tasks").insert({
    client: task.client,
    title: `QA: ${task.title}`,
    effort_hours: task.effort_hours,
    designation_required: "QA",
    due_date: task.due_date,
  });

  if (insertError) {
    console.error("[PLANNER:BE] handleDeveloperCompletionHandoff - Failed to create QA task", {
      error: insertError.message,
    });
    return { qaTaskCreated: false, noQaInOrg };
  }

  console.log("[PLANNER:BE] handleDeveloperCompletionHandoff - QA task created", {
    title: `QA: ${task.title}`,
    noQaInOrg,
  });

  return { qaTaskCreated: true, noQaInOrg };
}

/**
 * Mark a plan as completed
 */
export async function markPlanCompleted(
  planId: number
): Promise<ActionResult<QaHandoffResult>> {
  console.log("[PLANNER:BE] markPlanCompleted - Called", { planId });
  try {
    if (!planId) {
      console.log("[PLANNER:BE] markPlanCompleted - Validation failed: missing planId");
      return {
        success: false,
        error: "plan_id is required",
      };
    }

    const supabase = await createServerSupabaseClient();

    // First, fetch the plan with task details to get due_date
    console.log("[PLANNER:BE] markPlanCompleted - Fetching plan with task details", { planId });
    const { data: planData, error: fetchError } = await supabase
      .from("plans")
      .select(`
        *,
        task:tasks(title, client, effort_hours, designation_required, due_date)
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

    const taskDetails = planData.task as {
      title: string;
      client: string;
      effort_hours: number;
      designation_required: string;
      due_date: string | null;
    } | null;
    const taskDueDate = taskDetails?.due_date || null;
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

    // If this was a Developer task, hand it off to QA by cloning a QA task
    let qaHandoff: QaHandoffResult = { qaTaskCreated: false, noQaInOrg: false };
    if (taskDetails) {
      qaHandoff = await handleDeveloperCompletionHandoff(supabase, taskDetails);
    }

    // Revalidate the planner and tasks pages to show updated data
    revalidatePath("/planner");
    if (qaHandoff.qaTaskCreated) {
      revalidatePath("/tasks");
    }
    console.log("[PLANNER:BE] markPlanCompleted - Success, revalidated path", {
      planId,
      completionType,
      endDate,
      qaHandoff,
    });

    return {
      success: true,
      data: qaHandoff,
    };
  } catch (error: unknown) {
    console.error("[PLANNER:BE] markPlanCompleted - Unexpected error", {
      planId,
      error: getErrorMessage(error),
    });
    return {
      success: false,
      error: getErrorMessage(error) || "Failed to mark plan as completed",
    };
  }
}
