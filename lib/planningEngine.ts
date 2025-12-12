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

    plans.push({
      task_id: task.id,
      employee_id: selectedEmployee.id,
      start_date: startDate,
      end_date: endDate,
      total_hours: task.effort_hours,
    });
  }

  return plans;
}

export async function savePlanToDB(plans: PlanResult[]): Promise<boolean> {
  try {
    // Remove old plans - delete all existing plans
    // Using a condition that matches all rows (id is not null, which is always true for existing rows)
    const { error: deleteError } = await supabase
      .from("plans")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // This matches all rows since no real id equals this

    if (deleteError) {
      console.error("Error deleting old plans:", deleteError);
      // Continue anyway - might be first run or empty table
    }

    // Insert new plans
    if (plans.length > 0) {
      const { error: insertError } = await supabase
        .from("plans")
        .insert(plans);

      if (insertError) {
        console.error("Error inserting plans:", insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error saving plan to DB:", error);
    return false;
  }
}

