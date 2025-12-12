"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  Calendar,
  Layers,
  History,
  TrendingUp,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type DashboardCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
};

function DashboardCard({ icon, title, description, href }: DashboardCardProps) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full hover:shadow-lg hover:bg-accent/50 transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-primary">{icon}</div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          </div>
          <CardDescription className="text-base mt-2">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

type AnalyticsData = {
  totalEmployees: number;
  totalTasks: number;
  tasksPerClient: Array<{ name: string; value: number }>;
  upcomingLeaves: number;
  workloadDistribution: Array<{ name: string; hours: number }>;
  overdueTasks: number;
};

const COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

export default function Home() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEmployees: 0,
    totalTasks: 0,
    tasksPerClient: [],
    upcomingLeaves: 0,
    workloadDistribution: [],
    overdueTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // 1. Total Employees
      const { count: employeesCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("active", true);

      // 2. Total Tasks
      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      // 3. Tasks per Client
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("client");

      const clientCounts: Record<string, number> = {};
      tasksData?.forEach((task) => {
        clientCounts[task.client] = (clientCounts[task.client] || 0) + 1;
      });
      const tasksPerClient = Object.entries(clientCounts).map(([name, value]) => ({
        name,
        value,
      }));

      // 4. Upcoming Leaves (next 30 days)
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      
      const { count: leavesCount } = await supabase
        .from("leaves")
        .select("*", { count: "exact", head: true })
        .gte("leave_date", today.toISOString().split("T")[0])
        .lte("leave_date", thirtyDaysFromNow.toISOString().split("T")[0]);

      // 5. Workload Distribution (from plans)
      const { data: plansData } = await supabase
        .from("plans")
        .select("employee_id, total_hours, employee:employees(name)");

      const workloadMap: Record<string, { name: string; hours: number }> = {};
      plansData?.forEach((plan: any) => {
        const empId = plan.employee_id;
        const empName = plan.employee?.name || "Unknown";
        if (!workloadMap[empId]) {
          workloadMap[empId] = { name: empName, hours: 0 };
        }
        workloadMap[empId].hours += plan.total_hours || 0;
      });
      const workloadDistribution = Object.values(workloadMap).sort(
        (a, b) => b.hours - a.hours
      );

      // 6. Overdue Tasks (from plans)
      const { count: overdueCount } = await supabase
        .from("plans")
        .select("*", { count: "exact", head: true })
        .eq("is_overdue", true);

      setAnalytics({
        totalEmployees: employeesCount || 0,
        totalTasks: tasksCount || 0,
        tasksPerClient,
        upcomingLeaves: leavesCount || 0,
        workloadDistribution,
        overdueTasks: overdueCount || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      icon: <Users size={24} />,
      title: "Employees",
      description: "Manage team members, designations, and employee information.",
      href: "/employees",
    },
    {
      icon: <ClipboardList size={24} />,
      title: "Tasks",
      description: "Create and manage project tasks, clients, and effort estimates.",
      href: "/tasks",
    },
    {
      icon: <Calendar size={24} />,
      title: "Leaves",
      description: "Track employee leave dates and manage the leave calendar.",
      href: "/leaves",
    },
    {
      icon: <Layers size={24} />,
      title: "Planner",
      description: "Generate and view project schedules with smart task assignments.",
      href: "/planner",
    },
    {
      icon: <History size={24} />,
      title: "Version History",
      description: "View plan changes, version history, and scheduling updates.",
      href: "/planner/versions",
    },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-6">Smart Project Planner</h1>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
          Manage resources, tasks, availability, planning, and track changes.
        </p>
      </div>

      {/* Analytics Section */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading analytics...</div>
      ) : (
        <div className="mb-12 space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.totalEmployees}</div>
                <p className="text-xs text-slate-500">Active team members</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Total Tasks</CardTitle>
                <ClipboardList className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.totalTasks}</div>
                <p className="text-xs text-slate-500">Project tasks</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Upcoming Leaves</CardTitle>
                <Calendar className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{analytics.upcomingLeaves}</div>
                <p className="text-xs text-slate-500">Next 30 days</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">Overdue Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{analytics.overdueTasks}</div>
                <p className="text-xs text-slate-500">Requires attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tasks per Client Pie Chart */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">Tasks per Client</CardTitle>
                <CardDescription className="text-slate-500">Distribution of tasks across clients</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.tasksPerClient.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.tasksPerClient}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#1e40af"
                        dataKey="value"
                      >
                        {analytics.tasksPerClient.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f8fafc', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          color: '#1e293b'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No tasks data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workload Distribution Bar Chart */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-slate-800">Workload Distribution</CardTitle>
                <CardDescription className="text-slate-500">Total hours allocated per employee</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.workloadDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.workloadDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        stroke="#64748b"
                      />
                      <YAxis stroke="#64748b" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#f8fafc', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          color: '#1e293b'
                        }}
                      />
                      <Legend wrapperStyle={{ color: '#475569' }} />
                      <Bar dataKey="hours" fill="#1e40af" name="Total Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No workload data available. Generate a plan to see distribution.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Grid Layout of Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardCards.map((card) => (
          <DashboardCard
            key={card.href}
            icon={card.icon}
            title={card.title}
            description={card.description}
            href={card.href}
          />
        ))}
      </div>
    </div>
  );
}
