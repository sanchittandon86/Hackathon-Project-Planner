import { Suspense } from "react";
import { fetchEmployees, fetchLeaves } from "@/lib/leaves/server";
import LeavesClient from "./LeavesClient";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

/**
 * Server Component - Leaves Page
 * 
 * This page fetches leave and employee data on the server and passes it to
 * the client component for interactive UI. No Supabase client code
 * is shipped to the browser.
 */
export default async function LeavesPage() {
  // Fetch both employees and leaves data on the server in parallel
  console.log("[LEAVES:BE] Page load - Fetching employees and leaves data");
  const [employees, leaves] = await Promise.all([
    fetchEmployees(),
    fetchLeaves(),
  ]);
  console.log(`[LEAVES:BE] Page load - Fetched ${employees.length} employees and ${leaves.length} leaves`);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Calendar Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-semibold">Add Leave</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                  <div className="flex items-end">
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Existing Leaves</h3>
                <TableSkeleton rows={5} columns={3} />
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LeavesClient initialEmployees={employees} initialLeaves={leaves} />
    </Suspense>
  );
}
