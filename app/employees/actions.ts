"use server";

/**
 * Server Actions for employee mutations
 * 
 * All database write operations (create, update, delete) happen here.
 * These actions are called from client components but execute on the server.
 */

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { EmployeeInsert } from "@/types/database";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Add a new employee
 */
export async function addEmployee(
  employee: EmployeeInsert
): Promise<ActionResult> {
  console.log("[EMPLOYEES:ACTION] addEmployee called", { name: employee.name, designation: employee.designation, active: employee.active });
  try {
    if (!employee.name?.trim()) {
      console.log("[EMPLOYEES:ACTION] addEmployee - Validation failed: empty name");
      return {
        success: false,
        error: "Please enter employee name",
      };
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("employees")
      .insert([{ ...employee, last_updated: new Date().toISOString() }])
      .select();

    if (error) {
      console.error("[EMPLOYEES:ACTION] addEmployee - Supabase error:", error);
      return {
        success: false,
        error: "Failed to add employee. Please try again.",
      };
    }

    // Revalidate the employees page to show new data
    revalidatePath("/employees");
    console.log("[EMPLOYEES:ACTION] addEmployee - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[EMPLOYEES:ACTION] addEmployee - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(
  id: number,
  employee: EmployeeInsert
): Promise<ActionResult> {
  console.log("[EMPLOYEES:ACTION] updateEmployee called", { id, name: employee.name, designation: employee.designation, active: employee.active });
  try {
    if (!employee.name?.trim()) {
      console.log("[EMPLOYEES:ACTION] updateEmployee - Validation failed: empty name");
      return {
        success: false,
        error: "Please enter employee name",
      };
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("employees")
      .update({ ...employee, last_updated: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("[EMPLOYEES:ACTION] updateEmployee - Supabase error:", error);
      return {
        success: false,
        error: "Failed to update employee. Please try again.",
      };
    }

    // Revalidate the employees page to show updated data
    revalidatePath("/employees");
    console.log("[EMPLOYEES:ACTION] updateEmployee - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[EMPLOYEES:ACTION] updateEmployee - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Delete an employee and all associated data
 */
export async function deleteEmployee(id: number): Promise<ActionResult> {
  console.log("[EMPLOYEES:ACTION] deleteEmployee called", { id });
  try {
    const supabase = createServerSupabaseClient();

    // First, delete all plans associated with this employee
    console.log("[EMPLOYEES:ACTION] deleteEmployee - Deleting associated plans");
    const { error: plansError } = await supabase
      .from("plans")
      .delete()
      .eq("employee_id", id);

    if (plansError) {
      console.error("[EMPLOYEES:ACTION] deleteEmployee - Error deleting plans:", plansError);
      return {
        success: false,
        error: "Failed to delete associated plans. Please try again.",
      };
    }

    // Also delete all leaves associated with this employee
    console.log("[EMPLOYEES:ACTION] deleteEmployee - Deleting associated leaves");
    const { error: leavesError } = await supabase
      .from("leaves")
      .delete()
      .eq("employee_id", id);

    if (leavesError) {
      console.error("[EMPLOYEES:ACTION] deleteEmployee - Error deleting leaves:", leavesError);
      return {
        success: false,
        error: "Failed to delete associated leaves. Please try again.",
      };
    }

    // Now delete the employee
    console.log("[EMPLOYEES:ACTION] deleteEmployee - Deleting employee record");
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[EMPLOYEES:ACTION] deleteEmployee - Supabase error:", error);
      return {
        success: false,
        error: "Failed to delete employee. Please try again.",
      };
    }

    // Revalidate the employees page to show updated data
    revalidatePath("/employees");
    console.log("[EMPLOYEES:ACTION] deleteEmployee - Success, revalidated path");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[EMPLOYEES:ACTION] deleteEmployee - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

/**
 * Bulk import employees from CSV data
 */
export async function bulkImportEmployees(
  employees: EmployeeInsert[]
): Promise<ActionResult<{ inserted: number }>> {
  console.log("[EMPLOYEES:ACTION] bulkImportEmployees called", { count: employees.length });
  try {
    if (employees.length === 0) {
      console.log("[EMPLOYEES:ACTION] bulkImportEmployees - Validation failed: empty array");
      return {
        success: false,
        error: "No valid employees to import",
      };
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from("employees")
      .insert(
        employees.map((emp) => ({
          ...emp,
          last_updated: new Date().toISOString(),
        }))
      );

    if (error) {
      console.error("[EMPLOYEES:ACTION] bulkImportEmployees - Supabase error:", error);
      return {
        success: false,
        error: error.message || "Failed to import employees. Please try again.",
      };
    }

    // Revalidate the employees page to show new data
    revalidatePath("/employees");
    console.log(`[EMPLOYEES:ACTION] bulkImportEmployees - Success, inserted ${employees.length} employees, revalidated path`);

    return {
      success: true,
      data: {
        inserted: employees.length,
      },
    };
  } catch (error: any) {
    console.error("[EMPLOYEES:ACTION] bulkImportEmployees - Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
