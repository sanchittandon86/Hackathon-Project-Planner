import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Fetch all plan versions, ordered by generation timestamp (newest first), then by id
    const { data: versions, error: versionsError } = await supabase
      .from("plan_versions")
      .select("*")
      .order("generation_timestamp", { ascending: false })
      .order("id", { ascending: false });

    if (versionsError) {
      console.error("Error fetching plan versions:", versionsError);
      return NextResponse.json(
        { success: false, error: versionsError.message || "Failed to fetch plan versions" },
        { status: 500 }
      );
    }

    console.log(`API: Found ${versions?.length || 0} version records`);
    console.log("API: Raw versions data:", JSON.stringify(versions, null, 2));

    if (!versions || versions.length === 0) {
      console.log("API: No versions found, returning empty array");
      return NextResponse.json({
        success: true,
        versions: [],
      });
    }

    console.log(`API: Processing ${versions.length} version records`);

    // Get unique task_ids and employee_ids to fetch details
    // Check if task_id and employee_id exist in the version records
    const hasTaskIdColumn = versions.some((v: any) => v.hasOwnProperty('task_id'));
    const hasEmployeeIdColumn = versions.some((v: any) => v.hasOwnProperty('employee_id'));
    
    console.log(`API: task_id column exists: ${hasTaskIdColumn}, employee_id column exists: ${hasEmployeeIdColumn}`);
    
    const taskIds = hasTaskIdColumn 
      ? [...new Set(versions.map((v: any) => v.task_id).filter(Boolean))]
      : [];
    const employeeIds = hasEmployeeIdColumn
      ? [...new Set(versions.map((v: any) => v.employee_id).filter(Boolean))]
      : [];
    
    console.log(`API: Found ${taskIds.length} unique task_ids:`, taskIds);
    console.log(`API: Found ${employeeIds.length} unique employee_ids:`, employeeIds);
    
    // If columns don't exist, we can't fetch task/employee details
    // User needs to add these columns to the database
    if (!hasTaskIdColumn || !hasEmployeeIdColumn) {
      console.warn("API: task_id or employee_id columns missing from plan_versions table. Please run migration.");
      // Return versions without task/employee details
      return NextResponse.json({
        success: true,
        versions: versions.map((v: any) => ({
          ...v,
          plan: {
            task: null,
            employee: null,
          },
        })),
      });
    }

    // Fetch tasks
    let tasks: any[] = [];
    if (taskIds.length > 0) {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, client")
        .in("id", taskIds);

      if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
      } else {
        tasks = tasksData || [];
      }
    }

    // Fetch employees
    let employees: any[] = [];
    if (employeeIds.length > 0) {
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("id, name")
        .in("id", employeeIds);

      if (employeesError) {
        console.error("Error fetching employees:", employeesError);
      } else {
        employees = employeesData || [];
      }
    }

    // Create maps for quick lookup
    const tasksMap = new Map();
    tasks.forEach((task: any) => {
      tasksMap.set(task.id, task);
    });

    const employeesMap = new Map();
    employees.forEach((employee: any) => {
      employeesMap.set(employee.id, employee);
    });

    // Combine versions with task and employee data
    const versionsWithDetails = versions.map((version: any) => {
      // Get task_id and employee_id from version record
      const taskId = version.task_id;
      const employeeId = version.employee_id;

      // Use stored names if available (preserves names even after deletion), otherwise fetch from maps
      const employeeName = version.employee_name || employeesMap.get(employeeId)?.name || "Unknown Employee";
      const taskTitle = version.task_title || tasksMap.get(taskId)?.title || "Unknown Task";

      const result = {
        ...version,
        task_id: taskId,
        employee_id: employeeId,
        plan: {
          task_id: taskId,
          employee_id: employeeId,
          task: tasksMap.get(taskId) || { title: taskTitle, client: null },
          employee: employeesMap.get(employeeId) || { name: employeeName },
        },
      };
      
      console.log(`API: Processed version ${version.id}:`, {
        taskId,
        employeeId,
        employeeName,
        taskTitle,
        hasStoredEmployeeName: !!version.employee_name,
        hasStoredTaskTitle: !!version.task_title,
        hasTask: !!tasksMap.get(taskId),
        hasEmployee: !!employeesMap.get(employeeId),
      });
      
      return result;
    });

    console.log(`API: Returning ${versionsWithDetails.length} versions with details`);
    return NextResponse.json({
      success: true,
      versions: versionsWithDetails,
    });
  } catch (error: any) {
    console.error("Error fetching plan versions:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch plan versions" },
      { status: 500 }
    );
  }
}

