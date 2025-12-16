import { addDays, isWeekend } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDateLocal } from "@/lib/utils";

type Employee = {
  id: string;
  name: string;
  designation: string;
};

type Task = {
  id: string;
  title: string;
  client: string;
  effort_hours: number;
  designation_required: string;
  due_date?: string | null;
};

type Leave = {
  id: string;
  employee_id: string;
  leave_date: string;
};

export type PlanResult = {
  task_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  is_overdue: boolean;
  days_overdue: number;
};

export async function generatePlan(
  supabase: SupabaseClient,
  excludeCompleted: boolean = false
): Promise<PlanResult[]> {
  // 1. Fetch all master data
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("*");

  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .select("*");

  // If excluding completed plans, fetch completed plan task IDs
  let completedTaskIds: Set<string> = new Set();
  if (excludeCompleted) {
    const { data: completedPlans } = await supabase
      .from("plans")
      .select("task_id")
      .eq("is_completed", true);
    
    if (completedPlans) {
      completedTaskIds = new Set(completedPlans.map((p: any) => String(p.task_id)));
    }
  }

  const { data: leaves, error: leaveError } = await supabase
    .from("leaves")
    .select("*");

  if (empError || taskError || leaveError) {
    console.error("Error fetching data:", { empError, taskError, leaveError });
    return [];
  }

  if (!employees || !tasks) return [];

  // Filter out tasks with completed plans if excludeCompleted is true
  const tasksToPlan = excludeCompleted
    ? tasks.filter((task) => !completedTaskIds.has(String(task.id)))
    : tasks;

  if (tasksToPlan.length === 0) {
    console.log("No tasks to plan (all tasks are completed)");
    return [];
  }

  // Sort tasks by effort (smallest first for better distribution)
  tasksToPlan.sort((a, b) => a.effort_hours - b.effort_hours);

  const plans: PlanResult[] = [];
  const employeeWorkload: Map<string, Date> = new Map(); // Track when each employee is next available
  const workload: Record<string, number> = {}; // Track total hours allocated per employee

  // Initialize all employees to start from today and zero workload
  employees.forEach((emp) => {
    employeeWorkload.set(emp.id, new Date());
    workload[emp.id] = 0;
  });

  // Helper: check if employee is on leave on a specific day
  const isOnLeave = (empId: string, date: Date): boolean => {
    if (!leaves) return false;
    const dateStr = formatDateLocal(date);
    return leaves.some(
      (l) => l.employee_id === empId && l.leave_date === dateStr
    );
  };

  // Helper: get next available workday (skip weekends and leave days)
  const getNextWorkday = (empId: string, startDate: Date): Date => {
    let current = new Date(startDate);
    while (isWeekend(current) || isOnLeave(empId, current)) {
      current = addDays(current, 1);
    }
    return current;
  };

  // Helper: pick the employee with the least total allocated hours
  const pickLeastLoadedEmployee = (
    candidates: Employee[],
    workloadMap: Record<string, number>
  ): Employee | null => {
    if (candidates.length === 0) return null;

    return candidates.reduce((minEmp, emp) => {
      const minWorkload = workloadMap[minEmp.id] || 0;
      const empWorkload = workloadMap[emp.id] || 0;
      return empWorkload < minWorkload ? emp : minEmp;
    });
  };

  // 2. For each task, assign to the least loaded matching employee
  for (const task of tasksToPlan) {
    // Find employees with matching designation
    const candidates = employees.filter(
      (emp) => emp.designation === task.designation_required
    );

    if (candidates.length === 0) {
      // No matching employee found, skip this task
      continue;
    }

    // Select the employee with the least total allocated hours
    const selectedEmployee = pickLeastLoadedEmployee(candidates, workload);

    if (!selectedEmployee) continue;

    // Get the employee's next available date and find the next workday
    const nextAvailable = employeeWorkload.get(selectedEmployee.id);
    if (!nextAvailable) continue;

    const earliestDate = getNextWorkday(selectedEmployee.id, nextAvailable);

    // 3. Allocate task sequentially using 8 hours per day
    let remaining = task.effort_hours;
    let current = new Date(earliestDate);
    let startDate = "";
    let endDate = "";

    while (remaining > 0) {
      // Skip weekends and leave days
      if (isWeekend(current) || isOnLeave(selectedEmployee.id, current)) {
        current = addDays(current, 1);
        continue;
      }

      if (!startDate) {
        startDate = formatDateLocal(current);
      }

      // Allocate 8 hours for this day
      remaining -= 8;
      endDate = formatDateLocal(current);
      current = addDays(current, 1);
    }

    // Update employee's next available date
    employeeWorkload.set(selectedEmployee.id, current);

    // Update employee's total workload (for load balancing)
    workload[selectedEmployee.id] += task.effort_hours;

    // Calculate overdue status
    let is_overdue = false;
    let days_overdue = 0;
    
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const calculatedEndDate = new Date(endDate);
      
      if (calculatedEndDate > dueDate) {
        is_overdue = true;
        // Calculate days overdue (difference in days)
        const diffTime = calculatedEndDate.getTime() - dueDate.getTime();
        days_overdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    plans.push({
      task_id: task.id,
      employee_id: selectedEmployee.id,
      start_date: startDate,
      end_date: endDate,
      total_hours: task.effort_hours,
      is_overdue,
      days_overdue,
    });
  }

  return plans;
}

// Simulation types
export type SimulationOptions = {
  delayedTasks?: Array<{ task_id: string; delay_days: number }>;
  blockedEmployees?: Array<{ employee_id: string; from: string; to: string }>;
};

// Generate plan with simulation overrides (does NOT save to DB)
export async function generatePlanSimulation(
  supabase: SupabaseClient,
  options: SimulationOptions = {}
): Promise<PlanResult[]> {
  // 1. Fetch all master data
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("*");

  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .select("*");

  const { data: leaves, error: leaveError } = await supabase
    .from("leaves")
    .select("*");

  if (empError || taskError || leaveError) {
    console.error("Error fetching data:", { empError, taskError, leaveError });
    return [];
  }

  if (!employees || !tasks) return [];

  // 2. Apply simulation overrides
  // Create a map of delayed tasks
  const delayedTasksMap = new Map<string, number>();
  options.delayedTasks?.forEach((dt) => {
    delayedTasksMap.set(dt.task_id, dt.delay_days);
  });

  // Create blocked date ranges for employees
  const blockedRanges = new Map<string, Array<{ from: Date; to: Date }>>();
  options.blockedEmployees?.forEach((be) => {
    if (!blockedRanges.has(be.employee_id)) {
      blockedRanges.set(be.employee_id, []);
    }
    blockedRanges.get(be.employee_id)?.push({
      from: new Date(be.from),
      to: new Date(be.to),
    });
  });

  // Merge blocked ranges with existing leaves
  const extendedLeaves = leaves ? [...leaves] : [];
  options.blockedEmployees?.forEach((be) => {
    const fromDate = new Date(be.from);
    const toDate = new Date(be.to);
    let current = new Date(fromDate);
    
    while (current <= toDate) {
      const dateStr = formatDateLocal(current);
      // Only add if not already a leave
      if (!extendedLeaves.some(l => l.employee_id === be.employee_id && l.leave_date === dateStr)) {
        extendedLeaves.push({
          id: `sim-${be.employee_id}-${dateStr}`,
          employee_id: be.employee_id,
          leave_date: dateStr,
        });
      }
      current = addDays(current, 1);
    }
  });

  // Sort tasks by effort (smallest first for better distribution)
  tasks.sort((a, b) => a.effort_hours - b.effort_hours);

  const plans: PlanResult[] = [];
  const employeeWorkload: Map<string, Date> = new Map();
  const workload: Record<string, number> = {};

  // Initialize all employees to start from today and zero workload
  employees.forEach((emp) => {
    employeeWorkload.set(emp.id, new Date());
    workload[emp.id] = 0;
  });

  // Helper: check if employee is on leave or blocked on a specific day
  const isOnLeave = (empId: string, date: Date): boolean => {
    if (!extendedLeaves) return false;
    const dateStr = formatDateLocal(date);
    return extendedLeaves.some(
      (l) => l.employee_id === empId && l.leave_date === dateStr
    );
  };

  // Helper: get next available workday (skip weekends and leave/blocked days)
  const getNextWorkday = (empId: string, startDate: Date): Date => {
    let current = new Date(startDate);
    while (isWeekend(current) || isOnLeave(empId, current)) {
      current = addDays(current, 1);
    }
    return current;
  };

  // Helper: pick the employee with the least total allocated hours
  const pickLeastLoadedEmployee = (
    candidates: Employee[],
    workloadMap: Record<string, number>
  ): Employee | null => {
    if (candidates.length === 0) return null;

    return candidates.reduce((minEmp, emp) => {
      const minWorkload = workloadMap[minEmp.id] || 0;
      const empWorkload = workloadMap[emp.id] || 0;
      return empWorkload < minWorkload ? emp : minEmp;
    });
  };

  // 3. For each task, assign to the least loaded matching employee
  for (const task of tasks) {
    // Find employees with matching designation
    const candidates = employees.filter(
      (emp) => emp.designation === task.designation_required
    );

    if (candidates.length === 0) {
      continue;
    }

    // Select the employee with the least total allocated hours
    const selectedEmployee = pickLeastLoadedEmployee(candidates, workload);

    if (!selectedEmployee) continue;

    // Get the employee's next available date and find the next workday
    const nextAvailable = employeeWorkload.get(selectedEmployee.id);
    if (!nextAvailable) continue;

    let earliestDate = getNextWorkday(selectedEmployee.id, nextAvailable);

    // Apply delay if this task is delayed
    const delayDays = delayedTasksMap.get(task.id) || 0;
    if (delayDays > 0) {
      // Add delay days (skip weekends in delay calculation)
      let delayCount = 0;
      let delayDate = new Date(earliestDate);
      while (delayCount < delayDays) {
        delayDate = addDays(delayDate, 1);
        if (!isWeekend(delayDate) && !isOnLeave(selectedEmployee.id, delayDate)) {
          delayCount++;
        }
      }
      earliestDate = delayDate;
    }

    // 4. Allocate task sequentially using 8 hours per day
    let remaining = task.effort_hours;
    let current = new Date(earliestDate);
    let startDate = "";
    let endDate = "";

    while (remaining > 0) {
      // Skip weekends and leave/blocked days
      if (isWeekend(current) || isOnLeave(selectedEmployee.id, current)) {
        current = addDays(current, 1);
        continue;
      }

      if (!startDate) {
        startDate = formatDateLocal(current);
      }

      // Allocate 8 hours for this day
      remaining -= 8;
      endDate = formatDateLocal(current);
      current = addDays(current, 1);
    }

    // Update employee's next available date
    employeeWorkload.set(selectedEmployee.id, current);

    // Update employee's total workload (for load balancing)
    workload[selectedEmployee.id] += task.effort_hours;

    // Calculate overdue status
    let is_overdue = false;
    let days_overdue = 0;
    
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const calculatedEndDate = new Date(endDate);
      
      if (calculatedEndDate > dueDate) {
        is_overdue = true;
        const diffTime = calculatedEndDate.getTime() - dueDate.getTime();
        days_overdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    plans.push({
      task_id: task.id,
      employee_id: selectedEmployee.id,
      start_date: startDate,
      end_date: endDate,
      total_hours: task.effort_hours,
      is_overdue,
      days_overdue,
    });
  }

  return plans;
}

export async function savePlanToDB(
  supabase: SupabaseClient,
  plans: PlanResult[],
  excludeCompleted: boolean = false
): Promise<boolean> {
  console.log("[PLANNER:BE] savePlanToDB - Starting plan save", {
    planCount: plans.length,
    excludeCompleted,
  });
  try {
    // Generate a unique generation ID for this plan generation run
    // This groups all version records created in this single "Generate Plan" click
    const generationId = crypto.randomUUID();
    const generationTimestamp = new Date().toISOString();
    
    console.log("[PLANNER:BE] savePlanToDB - Generation ID created", {
      generationId,
      generationTimestamp,
    });

    // 1. Fetch existing plans for comparison
    console.log("[PLANNER:BE] savePlanToDB - Fetching existing plans for comparison");
    const { data: existingPlans, error: fetchError } = await supabase
      .from("plans")
      .select("*");

    if (fetchError) {
      console.error("[PLANNER:BE] savePlanToDB - Error fetching existing plans", {
        error: fetchError.message,
      });
      // Continue anyway - might be first run
    } else {
      console.log("[PLANNER:BE] savePlanToDB - Existing plans fetched", {
        existingPlanCount: existingPlans?.length || 0,
      });
    }

    // Fetch employee and task details for version records
    // Include both new plan employees/tasks and existing plan employees/tasks
    const newEmployeeIds = [...new Set(plans.map((p) => p.employee_id))];
    const newTaskIds = [...new Set(plans.map((p) => p.task_id))];
    
    const oldEmployeeIds = existingPlans 
      ? [...new Set(existingPlans.map((p: any) => p.employee_id))]
      : [];
    const oldTaskIds = existingPlans
      ? [...new Set(existingPlans.map((p: any) => p.task_id))]
      : [];
    
    const allEmployeeIds = [...new Set([...newEmployeeIds, ...oldEmployeeIds])];
    const allTaskIds = [...new Set([...newTaskIds, ...oldTaskIds])];

    const { data: employees } = await supabase
      .from("employees")
      .select("id, name")
      .in("id", allEmployeeIds);

    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title")
      .in("id", allTaskIds);

    // Create maps for quick lookup
    const employeesMap = new Map<string, string>();
    employees?.forEach((emp: any) => {
      employeesMap.set(emp.id, emp.name);
    });

    const tasksMap = new Map<string, string>();
    tasks?.forEach((task: any) => {
      tasksMap.set(task.id, task.title);
    });

    // Debug: Log what we're comparing
    console.log("[PLANNER:BE] savePlanToDB - Version comparison", {
      existingPlanCount: existingPlans?.length || 0,
      newPlanCount: plans.length,
      generationId,
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
      console.log("[PLANNER:BE] savePlanToDB - Comparing plans for version tracking", {
        existingPlanCount: existingPlans.length,
        newPlanCount: plans.length,
        generationId,
      });
      
      // Create maps for different lookups
      const existingPlansMap = new Map<string, any>(); // By task_id-employee_id
      const existingTasksMap = new Map<string, any>(); // By task_id only (to find reassignments - keep first occurrence)
      
      existingPlans.forEach((plan: any) => {
        const key = `${plan.task_id}-${plan.employee_id}`;
        existingPlansMap.set(key, plan);
        
        // Track tasks by task_id to detect reassignments (keep the first occurrence)
        // This helps identify when a task moves from one employee to another
        if (!existingTasksMap.has(plan.task_id)) {
          existingTasksMap.set(plan.task_id, plan);
        }
      });

      let dateChanges = 0;
      let reassignments = 0;
      let newTasks = 0;

      // Compare with new plans
      plans.forEach((newPlan) => {
        const key = `${newPlan.task_id}-${newPlan.employee_id}`;
        const oldPlan = existingPlansMap.get(key);
        const oldTaskPlan = existingTasksMap.get(newPlan.task_id);

        if (oldPlan) {
          // Same task + same employee: check if dates changed
          if (
            oldPlan.start_date !== newPlan.start_date ||
            oldPlan.end_date !== newPlan.end_date
          ) {
            dateChanges++;
            // Calculate delta_days (difference in end dates)
            const oldEndDate = new Date(oldPlan.end_date);
            const newEndDate = new Date(newPlan.end_date);
            const deltaDays =
              Math.floor(
                (newEndDate.getTime() - oldEndDate.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

            versionRecords.push({
              plan_id: oldPlan.id,
              task_id: newPlan.task_id,
              employee_id: newPlan.employee_id,
              employee_name: employeesMap.get(newPlan.employee_id) || "Unknown Employee",
              task_title: tasksMap.get(newPlan.task_id) || "Unknown Task",
              old_start_date: oldPlan.start_date,
              old_end_date: oldPlan.end_date,
              new_start_date: newPlan.start_date,
              new_end_date: newPlan.end_date,
              delta_days: deltaDays,
              generation_id: generationId,
              generation_timestamp: generationTimestamp,
            });
          }
        } else if (oldTaskPlan && oldTaskPlan.employee_id !== newPlan.employee_id) {
          // Task reassigned to different employee
          reassignments++;
          const oldEndDate = new Date(oldTaskPlan.end_date);
          const newEndDate = new Date(newPlan.end_date);
          const deltaDays =
            Math.floor(
              (newEndDate.getTime() - oldEndDate.getTime()) /
                (1000 * 60 * 60 * 24)
            );

          versionRecords.push({
            plan_id: oldTaskPlan.id,
            task_id: newPlan.task_id,
            employee_id: newPlan.employee_id,
            employee_name: employeesMap.get(newPlan.employee_id) || "Unknown Employee",
            task_title: tasksMap.get(newPlan.task_id) || "Unknown Task",
            old_start_date: oldTaskPlan.start_date,
            old_end_date: oldTaskPlan.end_date,
            new_start_date: newPlan.start_date,
            new_end_date: newPlan.end_date,
            delta_days: deltaDays,
            generation_id: generationId,
            generation_timestamp: generationTimestamp,
          });
        } else if (!oldTaskPlan) {
          // Completely new task - no old plan exists
          newTasks++;
          // Note: New tasks cannot be tracked in version history because:
          // 1. There's no old plan_id to reference (required by schema)
          // 2. There's no "old" state to compare against
          // They will appear in version history on the NEXT generation if dates change
        }
      });
      
      console.log("[PLANNER:BE] savePlanToDB - Version tracking summary", {
        dateChanges,
        reassignments,
        newTasks,
        totalVersionRecords: versionRecords.length,
        generationId,
      });
      
      // Debug: Log sample version records
      if (versionRecords.length > 0) {
        console.log("[PLANNER:BE] savePlanToDB - Sample version record", {
          sample: versionRecords[0],
          generationId,
        });
      }
    } else {
      console.log("[PLANNER:BE] savePlanToDB - No existing plans found, first generation", {
        generationId,
      });
    }

    // Insert version records if any changes detected
    // IMPORTANT: Insert BEFORE deleting plans, otherwise cascade delete will remove versions
    if (versionRecords.length > 0) {
      console.log("[VERSIONS:BE] savePlanToDB - Creating version records", {
        versionRecordCount: versionRecords.length,
        generationId,
      });
      const { data: insertedVersions, error: versionError } = await supabase
        .from("plan_versions")
        .insert(versionRecords)
        .select();

      if (versionError) {
        console.error("[VERSIONS:BE] savePlanToDB - Error inserting version records", {
          error: versionError.message,
          versionRecordCount: versionRecords.length,
          generationId,
        });
        // Continue anyway - versioning is not critical
      } else {
        console.log("[VERSIONS:BE] savePlanToDB - Version records created successfully", {
          insertedCount: insertedVersions?.length || 0,
          generationId,
          versionIds: insertedVersions?.map((v: any) => v.id),
        });
      }
    } else {
      console.log("[VERSIONS:BE] savePlanToDB - No version records to create", {
        generationId,
        reason: "no_date_changes_detected",
      });
    }

    // 3. Delete old plans (excluding completed ones if excludeCompleted is true)
    // NOTE: If plan_versions has "on delete cascade", versions will be deleted too
    // Solution: Make plan_id nullable or change to "on delete set null"
    console.log("[PLANNER:BE] savePlanToDB - Deleting old plans", {
      excludeCompleted,
      generationId,
    });
    let deleteQuery = supabase.from("plans");
    
    if (excludeCompleted) {
      // Only delete non-completed plans
      deleteQuery = deleteQuery.delete().eq("is_completed", false);
    } else {
      // Delete all plans
      deleteQuery = deleteQuery.delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    
    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error("[PLANNER:BE] savePlanToDB - Error deleting old plans", {
        error: deleteError.message,
        excludeCompleted,
        generationId,
      });
      // Continue anyway - might be first run or empty table
    } else {
      console.log("[PLANNER:BE] savePlanToDB - Old plans deleted successfully", {
        excludeCompleted,
        generationId,
      });
    }

    // 4. Insert new plans
    if (plans.length > 0) {
      console.log("[PLANNER:BE] savePlanToDB - Inserting new plans", {
        planCount: plans.length,
        generationId,
      });
      const plansWithTimestamp = plans.map((plan) => ({
        ...plan,
        last_updated: new Date().toISOString(),
      }));
      const { error: insertError } = await supabase
        .from("plans")
        .insert(plansWithTimestamp);

      if (insertError) {
        console.error("[PLANNER:BE] savePlanToDB - Error inserting plans", {
          error: insertError.message,
          planCount: plans.length,
          generationId,
        });
        return false;
      }
      console.log("[PLANNER:BE] savePlanToDB - Plans inserted successfully", {
        planCount: plans.length,
        generationId,
      });
    }

    console.log("[PLANNER:BE] savePlanToDB - Success", {
      planCount: plans.length,
      generationId,
    });
    return true;
  } catch (error: unknown) {
    console.error("[PLANNER:BE] savePlanToDB - Unexpected error", {
      error,
      planCount: plans.length,
      excludeCompleted,
    });
    return false;
  }
}

