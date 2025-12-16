import { Suspense } from "react";
import {
  fetchTasksForSimulator,
  fetchEmployeesForSimulator,
} from "@/lib/planner/simulator-server";
import SimulatorClient from "./SimulatorClient";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

/**
 * Server Component - Simulator Page
 * 
 * This page fetches task and employee data on the server and passes it to
 * the client component for simulation. No Supabase client code
 * is shipped to the browser.
 */
export default async function SimulatorPage() {
  // Fetch tasks and employees data on the server in parallel
  const [tasks, employees] = await Promise.all([
    fetchTasksForSimulator(),
    fetchEmployeesForSimulator(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle>What-If Scenario Simulator</CardTitle>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                  <CardDescription>
                    Simulate plan changes without modifying the real plan. Test
                    different scenarios before applying.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="grid gap-4 md:grid-cols-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid gap-4 md:grid-cols-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-600">Simulation Results</CardTitle>
              <CardDescription>
                This is a simulated plan. Click "Apply Changes" to make it real.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={6} columns={7} />
            </CardContent>
          </Card>
        </div>
      }
    >
      <SimulatorClient initialTasks={tasks} initialEmployees={employees} />
    </Suspense>
  );
}
