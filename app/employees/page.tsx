import { Suspense } from "react";
import { fetchEmployees } from "@/lib/employees/server";
import EmployeesClient from "./EmployeesClient";
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
 * Server Component - Employees Page
 * 
 * This page fetches employee data on the server and passes it to
 * the client component for interactive UI. No Supabase client code
 * is shipped to the browser.
 */
export default async function EmployeesPage() {
  // Fetch employees data on the server
  console.log("[EMPLOYEES:BE] Page load - Fetching employees data");
  const employees = await fetchEmployees();
  console.log(`[EMPLOYEES:BE] Page load - Fetched ${employees.length} employees`);

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
              <CardTitle className="text-3xl font-bold">Employee Master</CardTitle>
              <CardDescription className="mt-2">
                Manage your organization's employee records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <TableSkeleton rows={6} columns={4} />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <EmployeesClient initialEmployees={employees} />
    </Suspense>
  );
}
