"use server";

/**
 * Server Actions for leave mutations
 * 
 * All database write operations (create, delete) happen here.
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
 * Add a new leave
 */
export async function addLeave(
  employeeId: string,
  leaveDate: string
): Promise<ActionResult> {
  console.log("[LEAVES:ACTION] addLeave called", { employeeId, leaveDate });
  try {
    // Validate inputs
    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
      console.log("[LEAVES:ACTION] addLeave - Validation failed: empty employee ID");
      return {
        success: false,
        error: "Please select an employee",
      };
    }

    if (!leaveDate) {
      console.log("[LEAVES:ACTION] addLeave - Validation failed: empty leave date");
      return {
        success: false,
        error: "Please select a leave date",
      };
    }

    // Validate date format
    const date = new Date(leaveDate);
    if (isNaN(date.getTime())) {
      console.log("[LEAVES:ACTION] addLeave - Validation failed: invalid date format");
      return {
        success: false,
        error: "Invalid date format",
      };
    }

    const supabase = createServerSupabaseClient();

    // Check for duplicate leave (same employee, same date)
    console.log("[LEAVES:ACTION] addLeave - Checking for duplicate leave");
    const { data: existingLeaves, error: checkError } = await supabase
      .from("leaves")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("leave_date", leaveDate);

    if (checkError) {
      console.error("[LEAVES:ACTION] addLeave - Error checking duplicate:", checkError);
      return {
        success: false,
        error: "Failed to validate leave. Please try again.",
      };
    }

    if (existingLeaves && existingLeaves.length > 0) {
      console.log("[LEAVES:ACTION] addLeave - Validation failed: duplicate leave found");
      return {
        success: false,
        error: "This employee already has a leave on this date",
      };
    }

    // Insert the leave
    console.log("[LEAVES:ACTION] addLeave - Inserting leave");
    const { error } = await supabase.from("leaves").insert({
      employee_id: employeeId,
      leave_date: leaveDate,
      last_updated: new Date().toISOString(),
    });

    if (error) {
      console.error("[LEAVES:ACTION] addLeave - Supabase error:", error);
      return {
        success: false,
        error: "Failed to add leave. Please try again.",
      };
    }

    // Revalidate the leaves page to show new data
    revalidatePath("/leaves");
    console.log("[LEAVES:ACTION] addLeave - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[LEAVES:ACTION] addLeave - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Delete a leave
 */
export async function deleteLeave(id: number): Promise<ActionResult> {
  console.log("[LEAVES:ACTION] deleteLeave called", { id });
  try {
    if (!id) {
      console.log("[LEAVES:ACTION] deleteLeave - Validation failed: invalid ID");
      return {
        success: false,
        error: "Invalid leave ID",
      };
    }

    const supabase = createServerSupabaseClient();

    // First, fetch the leave to get the employee_id before deleting
    const { data: leaveData, error: fetchError } = await supabase
      .from("leaves")
      .select("employee_id")
      .eq("id", id)
      .single();

    if (fetchError || !leaveData) {
      console.error("[LEAVES:ACTION] deleteLeave - Error fetching leave", {
        error: fetchError?.message,
        id,
      });
      return {
        success: false,
        error: "Leave not found",
      };
    }

    // Delete the leave
    const { error } = await supabase
      .from("leaves")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[LEAVES:ACTION] deleteLeave - Supabase error:", error);
      return {
        success: false,
        error: "Failed to delete leave. Please try again.",
      };
    }

    // Update the employee's last_updated timestamp to trigger recalculation check
    // This ensures that when a leave is deleted, the planner will detect the change
    const { error: updateError } = await supabase
      .from("employees")
      .update({ last_updated: new Date().toISOString() })
      .eq("id", leaveData.employee_id);

    if (updateError) {
      console.warn("[LEAVES:ACTION] deleteLeave - Warning: Failed to update employee timestamp", {
        error: updateError.message,
        employeeId: leaveData.employee_id,
      });
      // Continue anyway - the leave is deleted, this is just for recalculation trigger
    } else {
      console.log("[LEAVES:ACTION] deleteLeave - Employee timestamp updated for recalculation trigger", {
        employeeId: leaveData.employee_id,
      });
    }

    // Revalidate the leaves page to show updated data
    revalidatePath("/leaves");
    console.log("[LEAVES:ACTION] deleteLeave - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[LEAVES:ACTION] deleteLeave - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
