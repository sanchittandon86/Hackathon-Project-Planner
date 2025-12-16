import { Suspense } from "react";
import { fetchPlanVersions } from "@/lib/planner/versions-server";
import VersionsClient from "./VersionsClient";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

/**
 * Server Component - Plan Versions Page
 * 
 * This page fetches plan versions data on the server and passes it to
 * the client component for display. No Supabase client code
 * is shipped to the browser.
 */
export default async function PlanVersionsPage() {
  // Fetch plan versions data on the server
  const versions = await fetchPlanVersions();

  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plan Version History</CardTitle>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={6} columns={7} />
            </CardContent>
          </Card>
        </div>
      }
    >
      <VersionsClient initialVersions={versions} />
    </Suspense>
  );
}
