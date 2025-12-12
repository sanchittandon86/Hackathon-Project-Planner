import { supabase } from "./supabaseClient";
import { addDays, isWeekend } from "date-fns";

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

export async function generatePlan(): Promise<PlanResult[]> {
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

  // Sort tasks by effort (smallest first for better distribution)
  tasks.sort((a, b) => a.effort_hours - b.effort_hours);

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
    const dateStr = date.toISOString().split("T")[0];
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
  for (const task of tasks) {
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
        startDate = current.toISOString().split("T")[0];
      }

      // Allocate 8 hours for this day
      remaining -= 8;
      endDate = current.toISOString().split("T")[0];
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
      const dateStr = current.toISOString().split("T")[0];
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
    const dateStr = date.toISOString().split("T")[0];
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
        startDate = current.toISOString().split("T")[0];
      }

      // Allocate 8 hours for this day
      remaining -= 8;
      endDate = current.toISOString().split("T")[0];
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

export async function savePlanToDB(plans: PlanResult[]): Promise<boolean> {
  try {
    // Generate a unique generation ID for this plan generation run
    // This groups all version records created in this single "Generate Plan" click
    const generationId = crypto.randomUUID();
    const generationTimestamp = new Date().toISOString();
    
    console.log(`Starting plan generation with generation_id: ${generationId}`);

    // 1. Fetch existing plans for comparison
    const { data: existingPlans, error: fetchError } = await supabase
      .from("plans")
      .select("*");

    if (fetchError) {
      console.error("Error fetching existing plans:", fetchError);
      // Continue anyway - might be first run
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
      console.log(`Comparing ${existingPlans.length} existing plans with ${plans.length} new plans`);
      
      // Create maps for different lookups
      const existingPlansMap = new Map<string, any>(); // By task_id-employee_id
      const existingTasksMap = new Map<string, any>(); // By task_id only (to find reassignments)
      
      existingPlans.forEach((plan: any) => {
        const key = `${plan.task_id}-${plan.employee_id}`;
        existingPlansMap.set(key, plan);
        
        // Track tasks by task_id to detect reassignments
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
      
      console.log(`Version tracking: ${dateChanges} date changes, ${reassignments} reassignments, ${newTasks} new tasks (not tracked)`);
    } else {
      console.log("No existing plans found - this is the first plan generation. No versions to track.");
    }

    // Insert version records if any changes detected
    // IMPORTANT: Insert BEFORE deleting plans, otherwise cascade delete will remove versions
    if (versionRecords.length > 0) {
      console.log(`Creating ${versionRecords.length} version records with generation_id: ${generationId}...`);
      const { data: insertedVersions, error: versionError } = await supabase
        .from("plan_versions")
        .insert(versionRecords)
        .select();

      if (versionError) {
        console.error("Error inserting version records:", versionError);
        console.error("Version records that failed:", versionRecords);
        // Continue anyway - versioning is not critical
      } else {
        console.log(`Successfully created ${insertedVersions?.length || 0} version records for generation ${generationId}`);
        console.log("Inserted version IDs:", insertedVersions?.map((v: any) => v.id));
      }
    } else {
      console.log(`No version records to create (no date changes detected) for generation ${generationId}`);
    }

    // 3. Delete old plans
    // NOTE: If plan_versions has "on delete cascade", versions will be deleted too
    // Solution: Make plan_id nullable or change to "on delete set null"
    const { error: deleteError } = await supabase
      .from("plans")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (deleteError) {
      console.error("Error deleting old plans:", deleteError);
      // Continue anyway - might be first run or empty table
    }

    // 4. Insert new plans
    if (plans.length > 0) {
      const plansWithTimestamp = plans.map((plan) => ({
        ...plan,
        last_updated: new Date().toISOString(),
      }));
      const { error: insertError } = await supabase
        .from("plans")
        .insert(plansWithTimestamp);

      if (insertError) {
        console.error("Error inserting plans:", insertError);
        return false;
      }
    }

    return true;
  } catch (error: unknown) {
    console.error("Error saving plan to DB:", error);
    return false;
  }
}

