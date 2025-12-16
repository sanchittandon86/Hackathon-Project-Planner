import { Suspense } from "react";
import { fetchPlans, checkRecalculationNeeded } from "@/lib/planner/server";
import PlannerClient from "./PlannerClient";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

/**
 * Server Component - Planner Page
 * 
 * This page fetches plan data with joins on the server and passes it to
 * the client component for interactive UI. No Supabase client code
 * is shipped to the browser.
 */
export default async function PlannerPage() {
  // Fetch plans and recalculation status in parallel
  const [plans, recalculationStatus] = await Promise.all([
    fetchPlans(),
    checkRecalculationNeeded(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Smart Project Planner</CardTitle>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={6} columns={9} />
            </CardContent>
          </Card>
        </div>
      }
    >
      <PlannerClient
        initialPlans={plans}
        initialRecalculationStatus={recalculationStatus}
      />
    </Suspense>
  );
}
