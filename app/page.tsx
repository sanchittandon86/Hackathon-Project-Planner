import { Suspense } from "react";
import { fetchDashboardAnalytics } from "@/lib/analytics/dashboard";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardCards from "@/components/dashboard/DashboardCards";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

/**
 * Server Component - Dashboard Home Page
 * 
 * This page fetches all analytics data on the server and passes it to
 * client components for interactive charts. No Supabase client code
 * is shipped to the browser.
 */
export default async function Home() {
  // Fetch analytics data on the server
  const analytics = await fetchDashboardAnalytics();

  return (
    <div className="container mx-auto py-2 px-4">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold mb-2">Smart Project Planner</h1>
        <p className="text-muted-foreground text-lg mb-2 max-w-2xl">
          Manage resources, tasks, availability, planning, and track changes.
        </p>
      </div>

      {/* Analytics Section */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardStats data={analytics} />
        <DashboardCharts data={analytics} />
      </Suspense>

      {/* Grid Layout of Feature Cards */}
      <DashboardCards />
    </div>
  );
}
