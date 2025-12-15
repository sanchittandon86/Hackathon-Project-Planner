"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { HowItWorksModal } from "@/components/HowItWorksModal";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Plan = {
  id: string;
  task_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  is_overdue?: boolean;
  days_overdue?: number;
  is_completed?: boolean;
  completed_at?: string | null;
  task?: {
    title: string;
    client: string;
    due_date?: string | null;
  };
  employee?: {
    name: string;
  };
};

type PlanWithDetails = Plan & {
  task_title: string;
  task_client: string;
  employee_name: string;
  task_due_date?: string | null;
};

type ClientGroup = {
  client: string;
  plans: PlanWithDetails[];
};

type SprintGroup = {
  sprintNumber: number;
  startDate: string;
  endDate: string;
  plans: PlanWithDetails[];
};

export default function PlannerPage() {
  const [plans, setPlans] = useState<PlanWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("date");
  const [needsRecalculation, setNeedsRecalculation] = useState(false);
  const [checkingRecalculation, setCheckingRecalculation] = useState(false);
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Fetch plans with joined task and employee data
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(
          `
          *,
          task:tasks(title, client, due_date),
          employee:employees(name)
        `
        )
        .order("start_date", { ascending: true });

      if (plansError) {
        console.error("Error fetching plans:", plansError);
        setLoading(false);
        return;
      }

      if (!plansData || plansData.length === 0) {
        setPlans([]);
        setLoading(false);
        return;
      }

      // Transform data to include task_title, task_client, employee_name, and due_date
      const plansWithDetails: PlanWithDetails[] = plansData.map((plan: any) => ({
        ...plan,
        task_title: plan.task?.title || "Unknown Task",
        task_client: plan.task?.client || "Unknown Client",
        employee_name: plan.employee?.name || "Unknown Employee",
        task_due_date: plan.task?.due_date || null,
        // Ensure is_overdue and days_overdue are properly set
        is_overdue: plan.is_overdue || false,
        days_overdue: plan.days_overdue || 0,
        // Ensure completion fields are set
        is_completed: plan.is_completed || false,
        completed_at: plan.completed_at || null,
      }));

      setPlans(plansWithDetails);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkRecalculationNeeded = async () => {
    setCheckingRecalculation(true);
    try {
      // Get max last_updated from master data tables
      const [employeesResult, tasksResult, leavesResult, plansResult] =
        await Promise.all([
          supabase
            .from("employees")
            .select("last_updated")
            .order("last_updated", { ascending: false })
            .limit(1),
          supabase
            .from("tasks")
            .select("last_updated")
            .order("last_updated", { ascending: false })
            .limit(1),
          supabase
            .from("leaves")
            .select("last_updated")
            .order("last_updated", { ascending: false })
            .limit(1),
          supabase
            .from("plans")
            .select("last_updated")
            .order("last_updated", { ascending: false })
            .limit(1),
        ]);

      const employeesMax =
        employeesResult.data?.[0]?.last_updated || null;
      const tasksMax = tasksResult.data?.[0]?.last_updated || null;
      const leavesMax = leavesResult.data?.[0]?.last_updated || null;
      const plansMax = plansResult.data?.[0]?.last_updated || null;

      // Find the latest master data update
      const masterDates = [
        employeesMax,
        tasksMax,
        leavesMax,
      ].filter(Boolean) as string[];

      if (masterDates.length === 0) {
        // No master data yet, no need to recalculate
        setNeedsRecalculation(false);
        return;
      }

      const latestMasterUpdate = new Date(
        Math.max(...masterDates.map((d) => new Date(d).getTime()))
      );

      // Compare with plans update
      if (!plansMax) {
        // Plans don't exist, but master data does - needs recalculation
        setNeedsRecalculation(true);
        return;
      }

      const plansUpdate = new Date(plansMax);

      // If master data is newer than plans, show alert
      setNeedsRecalculation(latestMasterUpdate > plansUpdate);
    } catch (error) {
      console.error("Error checking recalculation:", error);
      setNeedsRecalculation(false);
    } finally {
      setCheckingRecalculation(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    checkRecalculationNeeded();
  }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // Refresh plans after generation
        await fetchPlans();
        // Recheck if recalculation is needed (should be false now)
        await checkRecalculationNeeded();
      } else {
        console.error("Failed to generate plan:", data.error);
        alert("Failed to generate plan. Please check the console.");
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      alert("Error generating plan. Please check the console.");
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get completion status badge for a plan
  const getCompletionStatusBadge = (plan: PlanWithDetails) => {
    if (plan.is_completed) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(plan.end_date);
    endDate.setHours(0, 0, 0, 0);

    if (startDate > today) {
      return <Badge variant="outline">Not Started</Badge>;
    }

    if (endDate < today && !plan.is_completed) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">In Progress</Badge>;
  };

  // Helper function to get status badge for a plan (due date based)
  const getStatusBadge = (plan: PlanWithDetails) => {
    if (!plan.task_due_date) {
      return null; // No due date, no badge
    }

    const dueDate = new Date(plan.task_due_date);
    const endDate = new Date(plan.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (plan.is_overdue && (plan.days_overdue ?? 0) > 0) {
      const daysOverdue = plan.days_overdue ?? 0;
      return (
        <Badge variant="destructive">
          Overdue by {daysOverdue} day{daysOverdue !== 1 ? "s" : ""}
        </Badge>
      );
    } else if (daysUntilDue >= 0 && daysUntilDue <= 2) {
      return (
        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
          Due soon ({daysUntilDue === 0 ? "Today" : `${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`})
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          On Time
        </Badge>
      );
    }
  };

  // Mark plan as completed
  const markCompleted = async (planId: string) => {
    try {
      const response = await fetch("/api/complete-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_id: planId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Task marked as completed!");
        // Refresh plans
        await fetchPlans();
      } else {
        toast.error(`Failed to mark as completed: ${data.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Error marking plan as completed:", error);
      toast.error("Failed to mark as completed");
    }
  };

  // Check if task can be marked as completed
  const canMarkCompleted = (plan: PlanWithDetails): boolean => {
    if (plan.is_completed) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(plan.start_date);
    startDate.setHours(0, 0, 0, 0);
    
    return startDate <= today;
  };

  // Filter plans based on overdue filter
  const filteredPlans = useMemo(() => {
    if (!showOnlyOverdue) return plans;
    return plans.filter((plan) => plan.is_overdue === true);
  }, [plans, showOnlyOverdue]);

  // Group plans by client (using filtered plans)
  const clientGroups = useMemo(() => {
    const groups: Record<string, PlanWithDetails[]> = {};
    filteredPlans.forEach((plan) => {
      const client = plan.task_client;
      if (!groups[client]) {
        groups[client] = [];
      }
      groups[client].push(plan);
    });

    return Object.entries(groups)
      .map(([client, plans]) => ({ client, plans }))
      .sort((a, b) => a.client.localeCompare(b.client));
  }, [filteredPlans]);

  // Group plans by sprint (14-day buckets) (using filtered plans)
  const sprintGroups = useMemo(() => {
    if (filteredPlans.length === 0) return [];

    // Find the earliest start date
    const earliestDate = new Date(
      Math.min(...filteredPlans.map((p) => new Date(p.start_date).getTime()))
    );

    // Group by sprint (14-day periods)
    const groups: Record<number, PlanWithDetails[]> = {};

    filteredPlans.forEach((plan) => {
      const planStartDate = new Date(plan.start_date);
      const daysDiff = Math.floor(
        (planStartDate.getTime() - earliestDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const sprintNumber = Math.floor(daysDiff / 14) + 1;

      if (!groups[sprintNumber]) {
        groups[sprintNumber] = [];
      }
      groups[sprintNumber].push(plan);
    });

    // Convert to array and calculate sprint date ranges
    return Object.entries(groups)
      .map(([sprintNum, plans]) => {
        const sprintNumber = parseInt(sprintNum);
        const sprintStartDays = (sprintNumber - 1) * 14;
        const sprintStartDate = new Date(earliestDate);
        sprintStartDate.setDate(sprintStartDate.getDate() + sprintStartDays);
        const sprintEndDate = new Date(sprintStartDate);
        sprintEndDate.setDate(sprintEndDate.getDate() + 13);

        return {
          sprintNumber,
          startDate: sprintStartDate.toISOString().split("T")[0],
          endDate: sprintEndDate.toISOString().split("T")[0],
          plans: plans.sort(
            (a, b) =>
              new Date(a.start_date).getTime() -
              new Date(b.start_date).getTime()
          ),
        };
      })
      .sort((a, b) => a.sprintNumber - b.sprintNumber);
  }, [filteredPlans]);

  // Date-wise view (sorted by start_date)
  const DateWiseView = () => {
    const sortedPlans = [...filteredPlans].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    if (sortedPlans.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {showOnlyOverdue ? "No overdue tasks" : "No plans available"}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task Title</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">
                {plan.task_title}
              </TableCell>
              <TableCell>{plan.employee_name}</TableCell>
              <TableCell>
                <Badge variant="outline">{plan.task_client}</Badge>
              </TableCell>
              <TableCell>{formatDate(plan.start_date)}</TableCell>
              <TableCell>{formatDate(plan.end_date)}</TableCell>
              <TableCell>{getCompletionStatusBadge(plan)}</TableCell>
              <TableCell>{getStatusBadge(plan)}</TableCell>
              <TableCell>{plan.total_hours}</TableCell>
              <TableCell>
                {canMarkCompleted(plan) ? (
                  <Button
                    size="sm"
                    onClick={() => markCompleted(plan.id)}
                    variant="outline"
                  >
                    Mark Completed
                  </Button>
                ) : plan.is_completed ? (
                  <span className="text-sm text-muted-foreground">Completed</span>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            size="sm"
                            disabled
                            variant="ghost"
                          >
                            Mark Completed
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cannot complete before start date</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Client-wise view (grouped by client)
  const ClientWiseView = () => {
    if (clientGroups.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {showOnlyOverdue ? "No overdue tasks" : "No plans available"}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {clientGroups.map((group) => (
          <Card key={group.client}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  <Badge variant="secondary" className="mr-2">
                    {group.plans.length}
                  </Badge>
                  {group.client}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Title</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.task_title}
                      </TableCell>
                      <TableCell>{plan.employee_name}</TableCell>
                      <TableCell>{formatDate(plan.start_date)}</TableCell>
                      <TableCell>{formatDate(plan.end_date)}</TableCell>
                      <TableCell>{getCompletionStatusBadge(plan)}</TableCell>
                      <TableCell>{getStatusBadge(plan)}</TableCell>
                      <TableCell>{plan.total_hours}</TableCell>
                      <TableCell>
                        {canMarkCompleted(plan) ? (
                          <Button
                            size="sm"
                            onClick={() => markCompleted(plan.id)}
                            variant="outline"
                          >
                            Mark Completed
                          </Button>
                        ) : plan.is_completed ? (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="sm"
                                    disabled
                                    variant="ghost"
                                  >
                                    Mark Completed
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cannot complete before start date</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Sprint-wise view (grouped by 14-day sprints)
  const SprintWiseView = () => {
    if (sprintGroups.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {showOnlyOverdue ? "No overdue tasks" : "No plans available"}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {sprintGroups.map((sprint) => (
          <Card key={sprint.sprintNumber}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  <Badge variant="default" className="mr-2">
                    Sprint {sprint.sprintNumber}
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                  </span>
                </CardTitle>
                <Badge variant="secondary">
                  {sprint.plans.length} task{sprint.plans.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Title</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sprint.plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">
                        {plan.task_title}
                      </TableCell>
                      <TableCell>{plan.employee_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{plan.task_client}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(plan.start_date)}</TableCell>
                      <TableCell>{formatDate(plan.end_date)}</TableCell>
                      <TableCell>{getCompletionStatusBadge(plan)}</TableCell>
                      <TableCell>{getStatusBadge(plan)}</TableCell>
                      <TableCell>{plan.total_hours}</TableCell>
                      <TableCell>
                        {canMarkCompleted(plan) ? (
                          <Button
                            size="sm"
                            onClick={() => markCompleted(plan.id)}
                            variant="outline"
                          >
                            Mark Completed
                          </Button>
                        ) : plan.is_completed ? (
                          <span className="text-sm text-muted-foreground">Completed</span>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="sm"
                                    disabled
                                    variant="ghost"
                                  >
                                    Mark Completed
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cannot complete before start date</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {needsRecalculation && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recalculation Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Master data has changed. Please regenerate the plan.</span>
            <Button
              onClick={handleGeneratePlan}
              disabled={generating || loading}
              size="sm"
              className="ml-4"
            >
              {generating ? "Generating..." : "Recalculate Plan"}
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Smart Project Planner</CardTitle>
              <HowItWorksModal />
            </div>
            <Button
              onClick={handleGeneratePlan}
              disabled={generating || loading}
            >
              {generating ? "Generating..." : "Generate Plan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={6} columns={9} />
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No plans generated yet. Click "Generate Plan" to create a schedule.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showOverdue"
                    checked={showOnlyOverdue}
                    onChange={(e) => setShowOnlyOverdue(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label
                    htmlFor="showOverdue"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show only overdue tasks
                  </label>
                </div>
                <Badge variant="outline">
                  {filteredPlans.length} of {plans.length} tasks
                </Badge>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="date">Date-wise</TabsTrigger>
                  <TabsTrigger value="client">Client-wise</TabsTrigger>
                  <TabsTrigger value="sprint">Sprint-wise</TabsTrigger>
                </TabsList>
              <TabsContent value="date" className="mt-6">
                <DateWiseView />
              </TabsContent>
              <TabsContent value="client" className="mt-6">
                <ClientWiseView />
              </TabsContent>
              <TabsContent value="sprint" className="mt-6">
                <SprintWiseView />
              </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
