"use client";

/**
 * Client component for Workload Distribution Bar Chart
 * 
 * This component must be client-side because Recharts requires browser APIs.
 * It receives pre-aggregated data from the server component.
 */

import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { WorkloadDistribution } from "@/types/dashboard";

type WorkloadChartProps = {
  data: WorkloadDistribution[];
};

export default function WorkloadChart({ data }: WorkloadChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const axisColor = isDark ? "#a8a29e" : "#64748b";
  const gridColor = isDark ? "#3f3f46" : "#e2e8f0";
  const barColor = isDark ? "#f59e0b" : "#1e40af";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workload Distribution</CardTitle>
        <CardDescription>
          Total hours allocated per employee
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            {/* Keying on the theme forces a full remount on toggle, so the
                bars replay their grow-in animation with the new palette
                instead of silently swapping fill colors in place. */}
            <BarChart key={resolvedTheme} data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                stroke={axisColor}
              />
              <YAxis stroke={axisColor} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--popover-foreground)',
                }}
                itemStyle={{ color: 'var(--popover-foreground)' }}
                labelStyle={{ color: 'var(--popover-foreground)' }}
                cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
              />
              <Legend wrapperStyle={{ color: axisColor }} />
              <Bar
                dataKey="hours"
                fill={barColor}
                name="Total Hours"
                animationDuration={700}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No workload data available. Generate a plan to see distribution.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
