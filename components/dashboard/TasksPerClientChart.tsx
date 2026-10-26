"use client";

/**
 * Client component for Tasks per Client Pie Chart
 * 
 * This component must be client-side because Recharts requires browser APIs.
 * It receives pre-aggregated data from the server component.
 */

import { useTheme } from "next-themes";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { TasksPerClient } from "@/types/dashboard";

const LIGHT_COLORS = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];
// Dark mode leads with the amber accent for the largest/first slice, then
// recedes into neutral grays - keeps the one accent legible against a near-
// black background instead of the light palette's near-invisible slates.
const DARK_COLORS = ['#f59e0b', '#57534e', '#78716c', '#a8a29e', '#d6d3d1', '#e7e5e4'];

type TasksPerClientChartProps = {
  data: TasksPerClient[];
};

export default function TasksPerClientChart({ data }: TasksPerClientChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = resolvedTheme === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks per Client</CardTitle>
        <CardDescription>
          Distribution of tasks across clients
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            {/* Keying on the theme forces a full remount on toggle, so the
                slices replay their entry animation with the new palette
                instead of silently swapping fill colors in place. */}
            <PieChart key={resolvedTheme}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
                animationDuration={700}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--popover-foreground)',
                }}
                itemStyle={{ color: 'var(--popover-foreground)' }}
                labelStyle={{ color: 'var(--popover-foreground)' }}
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
