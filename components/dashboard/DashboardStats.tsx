/**
 * Server component for dashboard statistics cards
 *
 * This component renders the key metrics and task status cards.
 * It's a server component that receives pre-fetched data.
 */

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  Clock,
} from "lucide-react";
import type { DashboardAnalytics } from "@/types/dashboard";

type DashboardStatsProps = {
  data: DashboardAnalytics;
};

export default function DashboardStats({ data }: DashboardStatsProps) {
  return (
    <div className="mb-12 space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/employees" className="block">
          <Card className="hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/tasks" className="block">
          <Card className="hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">Project tasks</p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/leaves" className="block">
          <Card className="hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Leaves
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.upcomingLeaves}
            </div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        </Link>

        <Link href="/planner" className="block">
          <Card className="hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Tasks
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        </Link>
      </div>

      {/* Task Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Tasks
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.completedTasks}
            </div>
            <p className="text-xs text-muted-foreground">Tasks finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.inProgressTasks}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Not Started
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.notStartedTasks}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled for future</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
