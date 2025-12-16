"use client";

/**
 * Client component wrapper for dashboard charts
 * 
 * This component groups all chart components together.
 * All charts are client-side because Recharts requires browser APIs.
 */

import TasksPerClientChart from "./TasksPerClientChart";
import WorkloadChart from "./WorkloadChart";
import type { DashboardAnalytics } from "@/types/dashboard";

type DashboardChartsProps = {
  data: DashboardAnalytics;
};

export default function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TasksPerClientChart data={data.tasksPerClient} />
      <WorkloadChart data={data.workloadDistribution} />
    </div>
  );
}
