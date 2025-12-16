import { Suspense } from "react";
import { fetchTasks } from "@/lib/tasks/server";
import TasksClient from "./TasksClient";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = 'force-dynamic';

/**
 * Server Component - Tasks Page
 * 
 * This page fetches task data on the server and passes it to
 * the client component for interactive UI. No Supabase client code
 * is shipped to the browser.
 */
export default async function TasksPage() {
  // Fetch tasks data on the server
  console.log("[TASKS:BE] Page load - Fetching tasks data");
  const tasks = await fetchTasks();
  console.log(`[TASKS:BE] Page load - Fetched ${tasks.length} tasks`);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 px-4 space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">Tasks Master</CardTitle>
              <CardDescription className="mt-2">
                Manage project tasks and client requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <TableSkeleton rows={6} columns={6} />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <TasksClient initialTasks={tasks} />
    </Suspense>
  );
}
