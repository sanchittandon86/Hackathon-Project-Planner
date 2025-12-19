"use client";

/**
 * Client component for planner page UI
 * 
 * This component handles all interactive UI elements:
 * - Tabs and views
 * - Filters
 * - Plan generation trigger
 * - Completion actions
 * - Local UI state
 * 
 * It does NOT perform direct database operations.
 * All mutations go through Server Actions.
 */

import { useState, useTransition, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { HowItWorksModal } from "@/components/HowItWorksModal";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { markPlanCompleted } from "./actions";
import type {
  PlanWithDetails,
  RecalculationStatus,
} from "@/lib/planner/server";
import { formatDateLocal } from "@/lib/utils";

type PlannerClientProps = {
  initialPlans: PlanWithDetails[];
  initialRecalculationStatus: RecalculationStatus;
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

export default function PlannerClient({
  initialPlans,
  initialRecalculationStatus,
}: PlannerClientProps) {
  // Get today's date in local timezone (YYYY-MM-DD format)
  const getTodayLocal = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [plans, setPlans] = useState<PlanWithDetails[]>(initialPlans);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("date");
  const [needsRecalculation, setNeedsRecalculation] = useState(
    initialRecalculationStatus.needsRecalculation
  );
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);
  // Exclude completed tasks by default - preserves completed plans when regenerating
  const [excludeCompleted, setExcludeCompleted] = useState(true);

  // Update local state when initial data changes (after refresh)
  useEffect(() => {
    console.log("[PLANNER:FE] useEffect - Initial data updated", {
      planCount: initialPlans.length,
      needsRecalculation: initialRecalculationStatus.needsRecalculation,
    });
    setPlans(initialPlans);
    setNeedsRecalculation(initialRecalculationStatus.needsRecalculation);
  }, [initialPlans, initialRecalculationStatus]);

  // Refresh planner data after mutations
  const refreshPlanner = () => {
    console.log("[PLANNER:FE] refreshPlanner - Refreshing planner data");
    startTransition(() => {
      router.refresh();
    });
  };

  const handleGeneratePlan = async () => {
    console.log("[PLANNER:FE] handleGeneratePlan - Generate plan clicked", {
      excludeCompleted,
      intent: "generate_plan_clicked",
    });
    setGenerating(true);
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          excludeCompleted,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("[PLANNER:FE] handleGeneratePlan - Plan generated successfully", {
          planCount: data.plan?.length || 0,
          excludeCompleted,
        });
        toast.success("Plan generated successfully!");
        // Refresh plans after generation
        refreshPlanner();
      } else {
        console.error("[PLANNER:FE] handleGeneratePlan - Failed to generate plan", {
          error: data.error,
          excludeCompleted,
        });
        toast.error(
          data.error || "Failed to generate plan. Please check the console."
        );
      }
    } catch (error) {
      console.error("[PLANNER:FE] handleGeneratePlan - Unexpected error", {
        error,
        excludeCompleted,
      });
      toast.error("Error generating plan. Please check the console.");
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

    return (
      <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
        In Progress
      </Badge>
    );
  };

  // Helper function to get status badge for a plan (due date based)
  const getStatusBadge = (plan: PlanWithDetails) => {
    if (!plan.task_due_date) {
      return null; // No due date, no badge
    }

    // If plan is completed, compare end_date (completion date) with due_date
    if (plan.is_completed) {
      const dueDate = new Date(plan.task_due_date);
      const endDate = new Date(plan.end_date);
      dueDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      // Compare completion date with due date
      if (endDate <= dueDate) {
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            On Time
          </Badge>
        );
      } else {
        const daysLate = Math.ceil(
          (endDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return (
          <Badge variant="destructive">
            Late by {daysLate} day{daysLate !== 1 ? "s" : ""}
          </Badge>
        );
      }
    }

    // For incomplete plans, show status based on current date vs due date
    const dueDate = new Date(plan.task_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

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
          Due soon (
          {daysUntilDue === 0
            ? "Today"
            : `${daysUntilDue} day${daysUntilDue !== 1 ? "s" : ""}`}
          )
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
  const markCompleted = async (planId: number) => {
    // Find the plan to get due date and end date for logging
    const plan = plans.find((p) => p.id === planId);
    const dueDate = plan?.task_due_date || null;
    const endDate = getTodayLocal(); // Current date in local timezone (YYYY-MM-DD format)

    console.log("[PLANNER:FE] markCompleted - Mark completed clicked", {
      planId,
      taskTitle: plan?.task_title,
      employeeName: plan?.employee_name,
      dueDate,
      endDate,
      intent: "mark_completed_clicked",
    });

    try {
      const result = await markPlanCompleted(planId);

      if (!result.success) {
        console.error("[PLANNER:FE] markCompleted - Server action failed", {
          planId,
          error: result.error,
        });
        toast.error(
          result.error || "Failed to mark as completed: Unknown error"
        );
      } else {
        console.log("[PLANNER:FE] markCompleted - Success", {
          planId,
          taskTitle: plan?.task_title,
        });
        toast.success("Task marked as completed!");
        // Refresh plans
        refreshPlanner();
      }
    } catch (error: any) {
      console.error("[PLANNER:FE] markCompleted - Unexpected error", {
        planId,
        error,
      });
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

  // Separate completed and active plans
  const { activePlans, completedPlans } = useMemo(() => {
    const active = plans.filter((plan) => !plan.is_completed);
    const completed = plans.filter((plan) => plan.is_completed);
    return { activePlans: active, completedPlans: completed };
  }, [plans]);

  // Filter active plans based on overdue filter
  const filteredPlans = useMemo(() => {
    let filtered = activePlans;
    if (showOnlyOverdue) {
      filtered = filtered.filter((plan) => plan.is_overdue === true);
    }
    console.log("[PLANNER:FE] Filtered plans updated", {
      showOnlyOverdue,
      activePlansCount: activePlans.length,
      filteredPlansCount: filtered.length,
    });
    return filtered;
  }, [activePlans, showOnlyOverdue]);

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

  // Group plans by sprint (month-based, 3 sprints per month) (using filtered plans)
  const sprintGroups = useMemo(() => {
    if (filteredPlans.length === 0) return [];

    // Helper function to get days in a month
    const getDaysInMonth = (year: number, month: number): number => {
      return new Date(year, month + 1, 0).getDate();
    };

    // Helper function to determine which sprint (1, 2, or 3) a day falls into
    const getSprintForDay = (day: number, daysInMonth: number): number => {
      const sprintSize = Math.floor(daysInMonth / 3);
      const remainder = daysInMonth % 3;
      
      // Distribute remainder days across sprints
      if (day <= sprintSize + (remainder >= 1 ? 1 : 0)) {
        return 1;
      } else if (day <= (sprintSize * 2) + (remainder >= 2 ? 1 : 0)) {
        return 2;
      } else {
        return 3;
      }
    };

    // Helper function to calculate sprint date ranges for a month
    const getSprintDates = (year: number, month: number, sprintNum: number) => {
      const daysInMonth = getDaysInMonth(year, month);
      const sprintSize = Math.floor(daysInMonth / 3);
      const remainder = daysInMonth % 3;

      let startDay: number;
      let endDay: number;

      // Calculate sprint boundaries
      const sprint1End = sprintSize + (remainder >= 1 ? 1 : 0);
      const sprint2End = (sprintSize * 2) + (remainder >= 2 ? 1 : 0) + (remainder >= 1 ? 1 : 0);

      if (sprintNum === 1) {
        startDay = 1;
        endDay = sprint1End;
      } else if (sprintNum === 2) {
        startDay = sprint1End + 1;
        endDay = sprint2End;
      } else {
        startDay = sprint2End + 1;
        endDay = daysInMonth;
      }

      const startDate = new Date(year, month, startDay);
      const endDate = new Date(year, month, endDay);

      return {
        startDate: formatDateLocal(startDate),
        endDate: formatDateLocal(endDate),
      };
    };

    // Group plans by year-month-sprint based on end_date
    // This ensures tasks that span multiple sprints are grouped in the sprint where they end
    const groups: Record<string, PlanWithDetails[]> = {};

    filteredPlans.forEach((plan) => {
      // Use end_date to determine which sprint the task belongs to
      const planEndDate = new Date(plan.end_date);
      const year = planEndDate.getFullYear();
      const month = planEndDate.getMonth();
      const day = planEndDate.getDate();
      
      const daysInMonth = getDaysInMonth(year, month);
      const sprintNum = getSprintForDay(day, daysInMonth);
      
      // Create unique key: "YYYY-MM-SprintN"
      const sprintKey = `${year}-${String(month + 1).padStart(2, '0')}-Sprint${sprintNum}`;

      if (!groups[sprintKey]) {
        groups[sprintKey] = [];
      }
      groups[sprintKey].push(plan);
    });

    // Convert to array and calculate sprint date ranges
    return Object.entries(groups)
      .map(([sprintKey, plans]) => {
        // Parse year, month, and sprint number from key
        const [yearStr, monthStr, sprintStr] = sprintKey.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
        const sprintNum = parseInt(sprintStr.replace('Sprint', ''));

        const { startDate, endDate } = getSprintDates(year, month, sprintNum);

        // Create display name
        const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' });
        const sprintLabel = `${monthName} ${year} - Sprint ${sprintNum}`;

        return {
          sprintKey,
          sprintNumber: sprintNum,
          sprintLabel,
          monthYear: `${year}-${String(month + 1).padStart(2, '0')}`,
          startDate,
          endDate,
          plans: plans.sort(
            (a, b) =>
              new Date(a.start_date).getTime() -
              new Date(b.start_date).getTime()
          ),
        };
      })
      .sort((a, b) => {
        // Sort by year, then month, then sprint number
        if (a.monthYear !== b.monthYear) {
          return a.monthYear.localeCompare(b.monthYear);
        }
        return a.sprintNumber - b.sprintNumber;
      });
  }, [filteredPlans]);

  // Date-wise view (sorted by start_date)
  const DateWiseView = () => {
    const sortedPlans = [...filteredPlans].sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
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
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button size="sm" disabled variant="ghost">
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
                  {(() => {
                    // Calculate the latest delivery date from all plans in this group
                    const deliveryDates = group.plans
                      .map((plan) => plan.task_due_date)
                      .filter((date): date is string => date !== null && date !== undefined);
                    
                    if (deliveryDates.length > 0) {
                      // Find the latest date by comparing date strings (YYYY-MM-DD format)
                      const latestDeliveryDate = deliveryDates.sort().reverse()[0];
                      return (
                        <span className="ml-3 text-sm font-normal text-muted-foreground">
                          Delivery: {formatDate(latestDeliveryDate)}
                        </span>
                      );
                    }
                    return null;
                  })()}
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
                          <span className="text-sm text-muted-foreground">
                            Completed
                          </span>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button size="sm" disabled variant="ghost">
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

  // Sprint-wise view (grouped by month-based sprints, 3 per month)
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
          <Card key={sprint.sprintKey}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  <Badge variant="default" className="mr-2">
                    {sprint.sprintLabel}
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
                          <span className="text-sm text-muted-foreground">
                            Completed
                          </span>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button size="sm" disabled variant="ghost">
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
              disabled={generating || isPending}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl sm:text-2xl">Smart Project Planner</CardTitle>
              <HowItWorksModal />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludeCompleted"
                  checked={excludeCompleted}
                  onCheckedChange={(checked) => setExcludeCompleted(checked === true)}
                />
                <Label
                  htmlFor="excludeCompleted"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Exclude completed tasks
                </Label>
              </div>
              <Button
                onClick={handleGeneratePlan}
                disabled={generating || isPending}
                className="w-full sm:w-auto"
              >
                {generating ? "Generating..." : "Generate Plan"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
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
                  {filteredPlans.length} of {activePlans.length} active tasks
                </Badge>
              </div>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
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

      {/* Completed Plans Section */}
      {completedPlans.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Completed Tasks ({completedPlans.length})
            </CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedPlans
                  .sort(
                    (a, b) =>
                      new Date(b.completed_at || b.end_date).getTime() -
                      new Date(a.completed_at || a.end_date).getTime()
                  )
                  .map((plan) => (
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
