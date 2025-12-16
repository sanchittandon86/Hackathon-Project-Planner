"use client";

/**
 * Client component for simulator page UI
 * 
 * This component handles all interactive UI elements and simulation logic:
 * - Simulation engine (generatePlanSimulation)
 * - Delay and block controls
 * - Simulated plan previews
 * - Local state management
 * 
 * It does NOT perform direct database operations.
 * All mutations go through Server Actions.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SimulationOptions } from "@/lib/planningEngine";
import { runPlanSimulation } from "./actions";
import { toast } from "sonner";
import { Play, RotateCcw, CheckCircle } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { SimulatorHowItWorksModal } from "@/components/SimulatorHowItWorksModal";
import { applySimulation } from "./actions";
import type {
  Task,
  Employee,
} from "@/lib/planner/simulator-server";

type SimulatorClientProps = {
  initialTasks: Task[];
  initialEmployees: Employee[];
};

type SimulatedPlan = {
  task_id: string; // String to match simulation engine
  employee_id: string; // String to match simulation engine
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
  task_id: string; // String to match simulation engine
  delay_days: number;
};

type BlockedEmployee = {
  employee_id: string; // String to match simulation engine
  from: string;
  to: string;
};

export default function SimulatorClient({
  initialTasks,
  initialEmployees,
}: SimulatorClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tasks] = useState<Task[]>(initialTasks);
  const [employees] = useState<Employee[]>(initialEmployees);
  const [simulating, setSimulating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [simulatedPlans, setSimulatedPlans] = useState<SimulatedPlan[]>([]);

  // Simulation options
  const [delayedTasks, setDelayedTasks] = useState<DelayedTask[]>([]);
  const [blockedEmployees, setBlockedEmployees] = useState<BlockedEmployee[]>(
    []
  );

  // Form state for adding delayed task
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<string>("");
  const [delayDays, setDelayDays] = useState<number>(0);

  // Form state for blocking employee
  const [selectedEmployeeForBlock, setSelectedEmployeeForBlock] =
    useState<string>("");
  const [blockFrom, setBlockFrom] = useState<string>("");
  const [blockTo, setBlockTo] = useState<string>("");

  // Refresh simulator data after mutations
  const refreshSimulator = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleAddDelayedTask = () => {
    if (!selectedTaskForDelay || delayDays <= 0) {
      toast.error("Please select a task and enter delay days (greater than 0)");
      return;
    }

    // Check if task is already delayed
    if (
      delayedTasks.some((dt) => dt.task_id === selectedTaskForDelay)
    ) {
      toast.error(
        "This task is already delayed. Remove it first to change the delay."
      );
      return;
    }

    setDelayedTasks([
      ...delayedTasks,
      { task_id: selectedTaskForDelay, delay_days: delayDays },
    ]);
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
    const existing = blockedEmployees.find(
      (be) => be.employee_id === selectedEmployeeForBlock
    );
    if (existing) {
      toast.error(
        "This employee is already blocked. Remove the existing block first."
      );
      return;
    }

    setBlockedEmployees([
      ...blockedEmployees,
      {
        employee_id: selectedEmployeeForBlock,
        from: blockFrom,
        to: blockTo,
      },
    ]);
    setSelectedEmployeeForBlock("");
    setBlockFrom("");
    setBlockTo("");
    toast.success("Employee blocked");
  };

  const handleRemoveBlockedEmployee = (employeeId: string) => {
    setBlockedEmployees(
      blockedEmployees.filter((be) => be.employee_id !== employeeId)
    );
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    try {
      // Convert delayed tasks and blocked employees to string format for simulation
      const options: SimulationOptions = {
        delayedTasks:
          delayedTasks.length > 0
            ? delayedTasks.map((dt) => ({
                task_id: String(dt.task_id),
                delay_days: dt.delay_days,
              }))
            : undefined,
        blockedEmployees:
          blockedEmployees.length > 0
            ? blockedEmployees.map((be) => ({
                employee_id: String(be.employee_id),
                from: be.from,
                to: be.to,
              }))
            : undefined,
      };

      const result = await runPlanSimulation(options);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to run simulation");
      }
      
      const plans = result.data;

      // Use initial tasks and employees for display (no need to fetch again)
      const tasksMap = new Map<string, Task>();
      tasks.forEach((t) => tasksMap.set(t.id, t));

      const employeesMap = new Map<string, Employee>();
      employees.forEach((e) => employeesMap.set(e.id, e));

      // Keep IDs as strings (matching simulation engine) and add details
      const plansWithDetails: SimulatedPlan[] = plans.map((plan) => ({
        task_id: plan.task_id,
        employee_id: plan.employee_id,
        start_date: plan.start_date,
        end_date: plan.end_date,
        total_hours: plan.total_hours,
        is_overdue: plan.is_overdue || false,
        days_overdue: plan.days_overdue || 0,
        task: tasksMap.get(plan.task_id)
          ? {
              title: tasksMap.get(plan.task_id)!.title,
              client: tasksMap.get(plan.task_id)!.client,
            }
          : undefined,
        employee: employeesMap.get(plan.employee_id)
          ? {
              name: employeesMap.get(plan.employee_id)!.name,
            }
          : undefined,
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

    if (
      !confirm(
        "Are you sure you want to apply these changes? This will update the real plan."
      )
    ) {
      return;
    }

    setApplying(true);
    try {
      const result = await applySimulation(simulatedPlans);

      if (!result.success) {
        toast.error(
          result.error || "Failed to apply changes: Unknown error"
        );
      } else {
        toast.success(
          "Changes applied successfully! Plan has been updated."
        );
        // Clear simulation
        setSimulatedPlans([]);
        setDelayedTasks([]);
        setBlockedEmployees([]);
        // Refresh to get updated data
        refreshSimulator();
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
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle>What-If Scenario Simulator</CardTitle>
                <SimulatorHowItWorksModal />
              </div>
              <CardDescription>
                Simulate plan changes without modifying the real plan. Test
                different scenarios before applying.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delayed Tasks Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delayed Tasks</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Select
                value={selectedTaskForDelay}
                onValueChange={setSelectedTaskForDelay}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
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
                    <div
                      key={dt.task_id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span>
                        {task?.title || "Unknown"} - Delay {dt.delay_days} day
                        {dt.delay_days !== 1 ? "s" : ""}
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
              <Select
                value={selectedEmployeeForBlock}
                onValueChange={setSelectedEmployeeForBlock}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
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
                    <div
                      key={be.employee_id}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span>
                        {employee?.name || "Unknown"} - {formatDate(be.from)} to{" "}
                        {formatDate(be.to)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleRemoveBlockedEmployee(be.employee_id)
                        }
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
            <Button
              onClick={handleRunSimulation}
              disabled={simulating || isPending}
              className="flex-1"
            >
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
              <Button
                onClick={handleApplyChanges}
                disabled={applying || isPending}
                variant="default"
              >
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
      {simulating ? (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle className="text-blue-600">Running Simulation...</CardTitle>
            <CardDescription>
              Please wait while we calculate the simulated plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={6} columns={7} />
          </CardContent>
        </Card>
      ) : (
        simulatedPlans.length > 0 && (
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
                    .sort(
                      (a, b) =>
                        new Date(a.start_date).getTime() -
                        new Date(b.start_date).getTime()
                    )
                    .map((plan) => (
                      <TableRow key={`${plan.task_id}-${plan.employee_id}`}>
                        <TableCell className="font-medium">
                          {plan.task?.title || "Unknown Task"}
                        </TableCell>
                        <TableCell>
                          {plan.employee?.name || "Unknown Employee"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {plan.task?.client || "Unknown"}
                          </Badge>
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
        )
      )}
    </div>
  );
}
