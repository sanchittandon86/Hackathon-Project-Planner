"use server";

/**
 * Server Actions for task mutations
 * 
 * All database write operations (create, update, delete) happen here.
 * These actions are called from client components but execute on the server.
 */

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TaskInsert } from "@/types/database";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Add a new task
 */
export async function addTask(
  task: TaskInsert & { due_date?: string | null }
): Promise<ActionResult> {
  console.log("[TASKS:ACTION] addTask called", { client: task.client, title: task.title, effort_hours: task.effort_hours, designation_required: task.designation_required, due_date: task.due_date });
  try {
    // Validate inputs
    if (!task.client?.trim()) {
      console.log("[TASKS:ACTION] addTask - Validation failed: empty client name");
      return {
        success: false,
        error: "Please enter client name",
      };
    }

    if (!task.title?.trim()) {
      console.log("[TASKS:ACTION] addTask - Validation failed: empty title");
      return {
        success: false,
        error: "Please enter task title",
      };
    }

    if (!task.effort_hours || task.effort_hours <= 0) {
      console.log("[TASKS:ACTION] addTask - Validation failed: invalid effort hours");
      return {
        success: false,
        error: "Please enter valid effort hours (greater than 0)",
      };
    }

    // Validate due_date if provided
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        console.log("[TASKS:ACTION] addTask - Validation failed: due date in past");
        return {
          success: false,
          error: "Due date must be today or in the future",
        };
      }
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("tasks")
      .insert([{ ...task, last_updated: new Date().toISOString() }])
      .select();

    if (error) {
      console.error("[TASKS:ACTION] addTask - Supabase error:", error);
      return {
        success: false,
        error: "Failed to add task. Please try again.",
      };
    }

    // Revalidate the tasks page to show new data
    revalidatePath("/tasks");
    console.log("[TASKS:ACTION] addTask - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[TASKS:ACTION] addTask - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Update an existing task
 */
export async function updateTask(
  id: number,
  task: TaskInsert & { due_date?: string | null }
): Promise<ActionResult> {
  console.log("[TASKS:ACTION] updateTask called", { id, client: task.client, title: task.title, effort_hours: task.effort_hours, designation_required: task.designation_required, due_date: task.due_date });
  try {
    // Validate inputs
    if (!task.client?.trim()) {
      console.log("[TASKS:ACTION] updateTask - Validation failed: empty client name");
      return {
        success: false,
        error: "Please enter client name",
      };
    }

    if (!task.title?.trim()) {
      console.log("[TASKS:ACTION] updateTask - Validation failed: empty title");
      return {
        success: false,
        error: "Please enter task title",
      };
    }

    if (!task.effort_hours || task.effort_hours <= 0) {
      console.log("[TASKS:ACTION] updateTask - Validation failed: invalid effort hours");
      return {
        success: false,
        error: "Please enter valid effort hours (greater than 0)",
      };
    }

    // Validate due_date if provided
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        console.log("[TASKS:ACTION] updateTask - Validation failed: due date in past");
        return {
          success: false,
          error: "Due date must be today or in the future",
        };
      }
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("tasks")
      .update({ ...task, last_updated: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[TASKS:ACTION] updateTask - Supabase error:", error);
      return {
        success: false,
        error: "Failed to update task. Please try again.",
      };
    }

    // Revalidate the tasks page to show updated data
    revalidatePath("/tasks");
    console.log("[TASKS:ACTION] updateTask - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[TASKS:ACTION] updateTask - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(id: number): Promise<ActionResult> {
  console.log("[TASKS:ACTION] deleteTask called", { id });
  try {
    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[TASKS:ACTION] deleteTask - Supabase error:", error);
      return {
        success: false,
        error: "Failed to delete task. Please try again.",
      };
    }

    // Revalidate the tasks page to show updated data
    revalidatePath("/tasks");
    console.log("[TASKS:ACTION] deleteTask - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[TASKS:ACTION] deleteTask - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Bulk import tasks from CSV data
 */
export async function bulkImportTasks(
  tasks: TaskInsert[]
): Promise<ActionResult<{ inserted: number }>> {
  console.log("[TASKS:ACTION] bulkImportTasks called", { count: tasks.length });
  try {
    if (tasks.length === 0) {
      console.log("[TASKS:ACTION] bulkImportTasks - Validation failed: empty array");
      return {
        success: false,
        error: "No valid tasks to import",
      };
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("tasks")
      .insert(
        tasks.map((task) => ({
          ...task,
          last_updated: new Date().toISOString(),
        }))
      );

    if (error) {
      console.error("[TASKS:ACTION] bulkImportTasks - Supabase error:", error);
      return {
        success: false,
        error: error.message || "Failed to import tasks. Please try again.",
      };
    }

    // Revalidate the tasks page to show new data
    revalidatePath("/tasks");
    console.log(`[TASKS:ACTION] bulkImportTasks - Success, inserted ${tasks.length} tasks, revalidated path`);

    return {
      success: true,
      data: {
        inserted: tasks.length,
      },
    };
  } catch (error: any) {
    console.error("[TASKS:ACTION] bulkImportTasks - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
