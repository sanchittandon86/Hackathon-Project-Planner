"use server";

/**
 * Server Actions for simulator mutations
 * 
 * All database write operations for applying simulations happen here.
 * These actions are called from client components but execute on the server.
 */

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/utils";
import { generatePlanSimulation, type SimulationOptions, type PlanResult } from "@/lib/planningEngine";

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ExistingPlanRow = {
  id: string;
  task_id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
};

type EmployeeRow = { id: number; name: string };
type TaskRow = { id: number; title: string };

/**
 * Run plan simulation on the server
 * 
 * This executes the simulation engine server-side using the server Supabase client.
 */
export async function runPlanSimulation(
  options: SimulationOptions
): Promise<ActionResult<PlanResult[]>> {
  try {
    const supabase = await createServerSupabaseClient();
    const plans = await generatePlanSimulation(supabase, options);
    
    return {
      success: true,
      data: plans,
    };
  } catch (error: unknown) {
    console.error("Error running plan simulation:", error);
    return {
      success: false,
      error: getErrorMessage(error) || "Failed to run simulation",
    };
  }
}

/**
 * Apply simulated plans to the database
 * 
 * This takes simulated plans from the client and saves them to the database,
 * replacing the existing plan. Uses the same logic as savePlanToDB but with
 * server-side Supabase client.
 */
export async function applySimulation(
  simulatedPlans: Array<{
    task_id: string; // String from simulation engine
    employee_id: string; // String from simulation engine
    start_date: string;
    end_date: string;
    total_hours: number;
    is_overdue: boolean;
    days_overdue: number;
  }>
): Promise<ActionResult> {
  console.log("[PLANNER:BE] applySimulation - Applying simulation", {
    simulatedPlanCount: simulatedPlans?.length || 0,
  });
  try {
    if (!simulatedPlans || !Array.isArray(simulatedPlans) || simulatedPlans.length === 0) {
      console.log("[PLANNER:BE] applySimulation - Validation failed: no simulation results");
      return {
        success: false,
        error: "No simulation results to apply. Run simulation first.",
      };
    }

    const supabase = await createServerSupabaseClient();

    // Generate a unique generation ID for this plan generation run
    const generationId = crypto.randomUUID();
    const generationTimestamp = new Date().toISOString();
    console.log("[PLANNER:BE] applySimulation - Generation ID created", {
      generationId,
      generationTimestamp,
    });

    // 1. Fetch existing plans for comparison
    console.log("[PLANNER:BE] applySimulation - Fetching existing plans for comparison");
    const { data: existingPlans, error: fetchError } = await supabase
      .from("plans")
      .select("*") as { data: ExistingPlanRow[] | null; error: { message: string } | null };

    if (fetchError) {
      console.error("[PLANNER:BE] applySimulation - Error fetching existing plans", {
        error: fetchError.message,
      });
      // Continue anyway - might be first run
    } else {
      console.log("[PLANNER:BE] applySimulation - Existing plans fetched", {
        existingPlanCount: existingPlans?.length || 0,
      });
    }

    // Completed plans are historical records, not schedules to re-optimize.
    // Protect them from deletion/overwrite here, matching the same
    // safeguard in lib/planningEngine.ts's savePlanToDB().
    const completedTaskIds = new Set(
      (existingPlans || [])
        .filter((p) => p.is_completed)
        .map((p) => p.task_id)
    );
    const plansToApply = simulatedPlans.filter(
      (p) => !completedTaskIds.has(parseInt(p.task_id, 10))
    );

    // Capture which specific old rows are being superseded *before* we
    // insert anything, so we can delete exactly those by id afterward
    // instead of a blanket delete that would also remove rows we just
    // inserted (or plans that are protected above).
    const staleOldPlanIds = (existingPlans || [])
      .filter((p) => !p.is_completed)
      .map((p) => p.id);

    // Fetch employee and task details for version records
    // Convert string IDs to numbers for database queries
    const newEmployeeIds = [
      ...new Set(
        plansToApply
          .map((p) => parseInt(p.employee_id, 10))
          .filter((id) => !isNaN(id))
      ),
    ];
    const newTaskIds = [
      ...new Set(
        plansToApply
          .map((p) => parseInt(p.task_id, 10))
          .filter((id) => !isNaN(id))
      ),
    ];

    const oldEmployeeIds = existingPlans
      ? [...new Set(existingPlans.map((p) => p.employee_id))]
      : [];
    const oldTaskIds = existingPlans
      ? [...new Set(existingPlans.map((p) => p.task_id))]
      : [];

    const allEmployeeIds = [
      ...new Set([...newEmployeeIds, ...oldEmployeeIds]),
    ];
    const allTaskIds = [...new Set([...newTaskIds, ...oldTaskIds])];

    const { data: employees } = (await supabase
      .from("employees")
      .select("id, name")
      .in("id", allEmployeeIds)) as { data: EmployeeRow[] | null };

    const { data: tasks } = (await supabase
      .from("tasks")
      .select("id, title")
      .in("id", allTaskIds)) as { data: TaskRow[] | null };

    // Create maps for quick lookup
    const employeesMap = new Map<string, string>();
    employees?.forEach((emp) => {
      employeesMap.set(String(emp.id), emp.name);
    });

    const tasksMap = new Map<string, string>();
    tasks?.forEach((task) => {
      tasksMap.set(String(task.id), task.title);
    });

    // 2. Compare old and new plans and create version records
    const versionRecords: Array<{
      plan_id: string | null;
      task_id: string;
      employee_id: string;
      employee_name: string;
      task_title: string;
      old_start_date: string;
      old_end_date: string;
      new_start_date: string;
      new_end_date: string;
      delta_days: number;
      generation_id: string;
      generation_timestamp: string;
    }> = [];

    if (existingPlans && existingPlans.length > 0) {
      const existingPlansMap = new Map<string, ExistingPlanRow>();
      const existingTasksMap = new Map<string, ExistingPlanRow>();

      existingPlans.forEach((plan) => {
        const key = `${plan.task_id}-${plan.employee_id}`;
        existingPlansMap.set(key, plan);

        if (!existingTasksMap.has(String(plan.task_id))) {
          existingTasksMap.set(String(plan.task_id), plan);
        }
      });

      plansToApply.forEach((newPlan) => {
        // Convert string IDs to numbers for comparison with existing plans
        const taskIdNum = parseInt(newPlan.task_id, 10);
        const employeeIdNum = parseInt(newPlan.employee_id, 10);

        // Skip if invalid IDs
        if (isNaN(taskIdNum) || isNaN(employeeIdNum)) {
          return;
        }

        const key = `${taskIdNum}-${employeeIdNum}`;
        const oldPlan = existingPlansMap.get(key);
        const oldTaskPlan = existingTasksMap.get(newPlan.task_id);

        if (oldPlan) {
          // Same task + same employee: check if dates changed
          if (
            oldPlan.start_date !== newPlan.start_date ||
            oldPlan.end_date !== newPlan.end_date
          ) {
            const oldEndDate = new Date(oldPlan.end_date);
            const newEndDate = new Date(newPlan.end_date);
            const deltaDays = Math.floor(
              (newEndDate.getTime() - oldEndDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            versionRecords.push({
              plan_id: oldPlan.id,
              task_id: String(newPlan.task_id),
              employee_id: String(newPlan.employee_id),
              employee_name:
                employeesMap.get(String(newPlan.employee_id)) ||
                "Unknown Employee",
              task_title:
                tasksMap.get(String(newPlan.task_id)) || "Unknown Task",
              old_start_date: oldPlan.start_date,
              old_end_date: oldPlan.end_date,
              new_start_date: newPlan.start_date,
              new_end_date: newPlan.end_date,
              delta_days: deltaDays,
              generation_id: generationId,
              generation_timestamp: generationTimestamp,
            });
          }
        } else if (
          oldTaskPlan &&
          oldTaskPlan.employee_id !== employeeIdNum
        ) {
          // Task reassigned to different employee
          const oldEndDate = new Date(oldTaskPlan.end_date);
          const newEndDate = new Date(newPlan.end_date);
          const deltaDays = Math.floor(
            (newEndDate.getTime() - oldEndDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          versionRecords.push({
            plan_id: oldTaskPlan.id,
            task_id: String(newPlan.task_id),
            employee_id: String(newPlan.employee_id),
            employee_name:
              employeesMap.get(String(newPlan.employee_id)) ||
              "Unknown Employee",
            task_title:
              tasksMap.get(String(newPlan.task_id)) || "Unknown Task",
            old_start_date: oldTaskPlan.start_date,
            old_end_date: oldTaskPlan.end_date,
            new_start_date: newPlan.start_date,
            new_end_date: newPlan.end_date,
            delta_days: deltaDays,
            generation_id: generationId,
            generation_timestamp: generationTimestamp,
          });
        }
      });
    }

    // Insert version records if any changes detected
    if (versionRecords.length > 0) {
      console.log("[VERSIONS:BE] applySimulation - Creating version records", {
        versionRecordCount: versionRecords.length,
        generationId,
      });
      const { error: versionError } = await supabase
        .from("plan_versions")
        .insert(versionRecords);

      if (versionError) {
        console.error("[VERSIONS:BE] applySimulation - Error inserting version records", {
          error: versionError.message,
          versionRecordCount: versionRecords.length,
          generationId,
        });
        // Continue anyway - versioning is not critical
      } else {
        console.log("[VERSIONS:BE] applySimulation - Version records created successfully", {
          versionRecordCount: versionRecords.length,
          generationId,
        });
      }
    } else {
      console.log("[VERSIONS:BE] applySimulation - No version records to create", {
        generationId,
        reason: "no_changes_detected",
      });
    }

    // 3. Insert new plans BEFORE deleting old ones. If this insert fails,
    // we return early with the old plans still intact instead of leaving
    // the table empty.
    // Convert string IDs to numbers for database (database uses number IDs)
    if (plansToApply.length > 0) {
      console.log("[PLANNER:BE] applySimulation - Inserting new plans", {
        planCount: plansToApply.length,
        generationId,
      });
      const plansWithTimestamp = plansToApply
        .map((plan) => {
          const taskId = parseInt(plan.task_id, 10);
          const employeeId = parseInt(plan.employee_id, 10);

          // Skip plans with invalid IDs
          if (isNaN(taskId) || isNaN(employeeId)) {
            console.warn("Skipping plan with invalid IDs:", {
              task_id: plan.task_id,
              employee_id: plan.employee_id,
            });
            return null;
          }

          return {
            task_id: taskId,
            employee_id: employeeId,
            start_date: plan.start_date,
            end_date: plan.end_date,
            total_hours: plan.total_hours,
            is_overdue: plan.is_overdue,
            days_overdue: plan.days_overdue,
            last_updated: new Date().toISOString(),
          };
        })
        .filter((plan): plan is NonNullable<typeof plan> => plan !== null);

      const { error: insertError } = await supabase
        .from("plans")
        .insert(plansWithTimestamp);

      if (insertError) {
        console.error("[PLANNER:BE] applySimulation - Error inserting plans", {
          error: insertError.message,
          planCount: plansWithTimestamp.length,
          generationId,
        });
        return {
          success: false,
          error: "Failed to save plan to database",
        };
      }
      console.log("[PLANNER:BE] applySimulation - Plans inserted successfully", {
        planCount: plansWithTimestamp.length,
        generationId,
      });
    }

    // 4. Now that the new plans are safely inserted, delete the specific
    // stale non-completed rows captured in step 1 (by id, not a blanket
    // delete, which would also remove the rows we just inserted).
    // Completed plans are never touched, so completion history can't be
    // destroyed by applying a simulation.
    console.log("[PLANNER:BE] applySimulation - Deleting stale plans", {
      staleCount: staleOldPlanIds.length,
      generationId,
    });

    const { error: deleteError } =
      staleOldPlanIds.length > 0
        ? await supabase.from("plans").delete().in("id", staleOldPlanIds)
        : { error: null };

    if (deleteError) {
      console.error("[PLANNER:BE] applySimulation - Error deleting stale plans", {
        error: deleteError.message,
        generationId,
      });
      // Not returning false here: the new plans are already safely
      // inserted, so at worst this leaves stale duplicate rows to be
      // cleaned up on the next generation rather than losing data.
    } else {
      console.log("[PLANNER:BE] applySimulation - Stale plans deleted successfully", {
        generationId,
      });
    }

    // Revalidate both planner pages
    console.log("[PLANNER:BE] applySimulation - Revalidating paths", {
      generationId,
    });
    revalidatePath("/planner");
    revalidatePath("/planner/simulator");

    console.log("[PLANNER:BE] applySimulation - Success", {
      planCount: plansToApply.length,
      generationId,
    });
    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("[PLANNER:BE] applySimulation - Unexpected error", {
      error: getErrorMessage(error),
      simulatedPlanCount: simulatedPlans?.length || 0,
    });
    return {
      success: false,
      error: getErrorMessage(error) || "Failed to apply simulation",
    };
  }
}
