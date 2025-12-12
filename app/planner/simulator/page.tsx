"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { generatePlanSimulation, type SimulationOptions } from "@/lib/planningEngine";
import { toast } from "sonner";
import { Play, RotateCcw, CheckCircle } from "lucide-react";

type Task = {
  id: string;
  title: string;
  client: string;
  effort_hours: number;
  designation_required: string;
};

type Employee = {
  id: string;
  name: string;
  designation: string;
};

type SimulatedPlan = {
  task_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  is_overdue: boolean;
  days_overdue: number;
  task?: {
    title: string;
    client: string;
  };
  employee?: {
    name: string;
  };
};

type DelayedTask = {
  task_id: string;
  delay_days: number;
};

type BlockedEmployee = {
  employee_id: string;
  from: string;
  to: string;
};

export default function SimulatorPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [simulatedPlans, setSimulatedPlans] = useState<SimulatedPlan[]>([]);

  // Simulation options
  const [delayedTasks, setDelayedTasks] = useState<DelayedTask[]>([]);
  const [blockedEmployees, setBlockedEmployees] = useState<BlockedEmployee[]>([]);

  // Form state for adding delayed task
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<string>("");
  const [delayDays, setDelayDays] = useState<number>(0);

  // Form state for blocking employee
  const [selectedEmployeeForBlock, setSelectedEmployeeForBlock] = useState<string>("");
  const [blockFrom, setBlockFrom] = useState<string>("");
  const [blockTo, setBlockTo] = useState<string>("");

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("title");

      if (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to fetch tasks");
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("Error fetching employees:", error);
        toast.error("Failed to fetch employees");
      } else {
        setEmployees(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };

  const handleAddDelayedTask = () => {
    if (!selectedTaskForDelay || delayDays <= 0) {
      toast.error("Please select a task and enter delay days (greater than 0)");
      return;
    }

    // Check if task is already delayed
    if (delayedTasks.some((dt) => dt.task_id === selectedTaskForDelay)) {
      toast.error("This task is already delayed. Remove it first to change the delay.");
      return;
    }

    setDelayedTasks([...delayedTasks, { task_id: selectedTaskForDelay, delay_days: delayDays }]);
    setSelectedTaskForDelay("");
    setDelayDays(0);
    toast.success("Delayed task added");
  };

  const handleRemoveDelayedTask = (taskId: string) => {
    setDelayedTasks(delayedTasks.filter((dt) => dt.task_id !== taskId));
  };

  const handleAddBlockedEmployee = () => {
    if (!selectedEmployeeForBlock || !blockFrom || !blockTo) {
      toast.error("Please select an employee and enter date range");
      return;
    }

    const fromDate = new Date(blockFrom);
    const toDate = new Date(blockTo);

    if (toDate < fromDate) {
      toast.error("End date must be after start date");
      return;
    }

    // Check if employee is already blocked in this range
    const existing = blockedEmployees.find((be) => be.employee_id === selectedEmployeeForBlock);
    if (existing) {
      toast.error("This employee is already blocked. Remove the existing block first.");
      return;
    }

    setBlockedEmployees([
      ...blockedEmployees,
      { employee_id: selectedEmployeeForBlock, from: blockFrom, to: blockTo },
    ]);
    setSelectedEmployeeForBlock("");
    setBlockFrom("");
    setBlockTo("");
    toast.success("Employee blocked");
  };

  const handleRemoveBlockedEmployee = (employeeId: string) => {
    setBlockedEmployees(blockedEmployees.filter((be) => be.employee_id !== employeeId));
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      const options: SimulationOptions = {
        delayedTasks: delayedTasks.length > 0 ? delayedTasks : undefined,
        blockedEmployees: blockedEmployees.length > 0 ? blockedEmployees : undefined,
      };

      const plans = await generatePlanSimulation(options);

      // Fetch task and employee details for display
      const taskIds = [...new Set(plans.map((p) => p.task_id))];
      const employeeIds = [...new Set(plans.map((p) => p.employee_id))];

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("id, title, client")
        .in("id", taskIds);

      const { data: employeesData } = await supabase
        .from("employees")
        .select("id, name")
        .in("id", employeeIds);

      const tasksMap = new Map();
      tasksData?.forEach((t: any) => tasksMap.set(t.id, t));

      const employeesMap = new Map();
      employeesData?.forEach((e: any) => employeesMap.set(e.id, e));

      const plansWithDetails: SimulatedPlan[] = plans.map((plan) => ({
        ...plan,
        task: tasksMap.get(plan.task_id),
        employee: employeesMap.get(plan.employee_id),
      }));

      setSimulatedPlans(plansWithDetails);
      toast.success(`Simulation complete: ${plans.length} tasks planned`);
    } catch (error) {
      console.error("Error running simulation:", error);
      toast.error("Failed to run simulation");
    } finally {
      setSimulating(false);
    }
  };

  const handleApplyChanges = async () => {
    if (simulatedPlans.length === 0) {
      toast.error("No simulation results to apply. Run simulation first.");
      return;
    }

    if (!confirm("Are you sure you want to apply these changes? This will update the real plan.")) {
      return;
    }

    setApplying(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ simulatedPlans: simulatedPlans }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Changes applied successfully! Plan has been updated.");
        // Clear simulation
        setSimulatedPlans([]);
        setDelayedTasks([]);
        setBlockedEmployees([]);
      } else {
        toast.error("Failed to apply changes: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error applying changes:", error);
      toast.error("Failed to apply changes");
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    setDelayedTasks([]);
    setBlockedEmployees([]);
    setSimulatedPlans([]);
    setSelectedTaskForDelay("");
    setDelayDays(0);
    setSelectedEmployeeForBlock("");
    setBlockFrom("");
    setBlockTo("");
    toast.success("Simulation reset");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (plan: SimulatedPlan) => {
    if (!plan.is_overdue) return null;

    const daysOverdue = plan.days_overdue || 0;
    return (
      <Badge variant="destructive">
        Overdue by {daysOverdue} day{daysOverdue !== 1 ? "s" : ""}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>What-If Scenario Simulator</CardTitle>
          <CardDescription>
            Simulate plan changes without modifying the real plan. Test different scenarios before applying.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delayed Tasks Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delayed Tasks</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Select value={selectedTaskForDelay} onValueChange={setSelectedTaskForDelay}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title} ({task.client})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                placeholder="Delay days"
                value={delayDays || ""}
                onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
              />
              <Button onClick={handleAddDelayedTask}>Add Delay</Button>
            </div>
            {delayedTasks.length > 0 && (
              <div className="space-y-2">
                {delayedTasks.map((dt) => {
                  const task = tasks.find((t) => t.id === dt.task_id);
                  return (
                    <div key={dt.task_id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>
                        {task?.title || "Unknown"} - Delay {dt.delay_days} day{dt.delay_days !== 1 ? "s" : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDelayedTask(dt.task_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blocked Employees Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Blocked Employees</h3>
            <div className="grid gap-4 md:grid-cols-4">
              <Select value={selectedEmployeeForBlock} onValueChange={setSelectedEmployeeForBlock}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.designation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                placeholder="From date"
                value={blockFrom}
                onChange={(e) => setBlockFrom(e.target.value)}
              />
              <Input
                type="date"
                placeholder="To date"
                value={blockTo}
                onChange={(e) => setBlockTo(e.target.value)}
              />
              <Button onClick={handleAddBlockedEmployee}>Block Employee</Button>
            </div>
            {blockedEmployees.length > 0 && (
              <div className="space-y-2">
                {blockedEmployees.map((be) => {
                  const employee = employees.find((e) => e.id === be.employee_id);
                  return (
                    <div key={be.employee_id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>
                        {employee?.name || "Unknown"} - {formatDate(be.from)} to {formatDate(be.to)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlockedEmployee(be.employee_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={handleRunSimulation} disabled={simulating} className="flex-1">
              {simulating ? (
                <>Running Simulation...</>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            {simulatedPlans.length > 0 && (
              <Button onClick={handleApplyChanges} disabled={applying} variant="default">
                {applying ? (
                  <>Applying...</>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Apply Changes
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {simulatedPlans.length > 0 && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-600">Simulation Results</CardTitle>
            <CardDescription>
              This is a simulated plan. Click "Apply Changes" to make it real.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulatedPlans
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((plan) => (
                    <TableRow key={`${plan.task_id}-${plan.employee_id}`}>
                      <TableCell className="font-medium">
                        {plan.task?.title || "Unknown Task"}
                      </TableCell>
                      <TableCell>{plan.employee?.name || "Unknown Employee"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.task?.client || "Unknown"}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(plan.start_date)}</TableCell>
                      <TableCell>{formatDate(plan.end_date)}</TableCell>
                      <TableCell>{getStatusBadge(plan)}</TableCell>
                      <TableCell>{plan.total_hours}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

