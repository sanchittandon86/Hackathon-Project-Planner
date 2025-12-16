"use client";

/**
 * Client component for Tasks per Client Pie Chart
 * 
 * This component must be client-side because Recharts requires browser APIs.
 * It receives pre-aggregated data from the server component.
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { TasksPerClient } from "@/types/dashboard";

const COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

type TasksPerClientChartProps = {
  data: TasksPerClient[];
};

export default function TasksPerClientChart({ data }: TasksPerClientChartProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-800">Tasks per Client</CardTitle>
        <CardDescription className="text-slate-500">
          Distribution of tasks across clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#1e40af"
                dataKey="value"
              >
                {data.map((entry, index) => (
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
  );
}
