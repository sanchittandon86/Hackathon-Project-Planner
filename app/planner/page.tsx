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
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Plan = {
  id: string;
  task_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_hours: number;
  task?: {
    title: string;
    client: string;
  };
  employee?: {
    name: string;
  };
};

type PlanWithDetails = Plan & {
  task_title: string;
  task_client: string;
  employee_name: string;
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

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Fetch plans with joined task and employee data
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(
          `
          *,
          task:tasks(title, client),
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

      // Transform data to include task_title, task_client, and employee_name
      const plansWithDetails: PlanWithDetails[] = plansData.map((plan: any) => ({
        ...plan,
        task_title: plan.task?.title || "Unknown Task",
        task_client: plan.task?.client || "Unknown Client",
        employee_name: plan.employee?.name || "Unknown Employee",
      }));

      setPlans(plansWithDetails);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
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

  // Group plans by client
  const clientGroups = useMemo(() => {
    const groups: Record<string, PlanWithDetails[]> = {};
    plans.forEach((plan) => {
      const client = plan.task_client;
      if (!groups[client]) {
        groups[client] = [];
      }
      groups[client].push(plan);
    });

    return Object.entries(groups)
      .map(([client, plans]) => ({ client, plans }))
      .sort((a, b) => a.client.localeCompare(b.client));
  }, [plans]);

  // Group plans by sprint (14-day buckets)
  const sprintGroups = useMemo(() => {
    if (plans.length === 0) return [];

    // Find the earliest start date
    const earliestDate = new Date(
      Math.min(...plans.map((p) => new Date(p.start_date).getTime()))
    );

    // Group by sprint (14-day periods)
    const groups: Record<number, PlanWithDetails[]> = {};

    plans.forEach((plan) => {
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
  }, [plans]);

  // Date-wise view (sorted by start_date)
  const DateWiseView = () => {
    if (plans.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No plans available
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
            <TableHead>Total Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
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
              <TableCell>{plan.total_hours}</TableCell>
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
          No plans available
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
                    <TableHead>Total Hours</TableHead>
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
                      <TableCell>{plan.total_hours}</TableCell>
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
          No plans available
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
                    <TableHead>Total Hours</TableHead>
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
                      <TableCell>{plan.total_hours}</TableCell>
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Smart Project Planner</CardTitle>
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
            <div className="text-center py-8">Loading plans...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No plans generated yet. Click "Generate Plan" to create a schedule.
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
