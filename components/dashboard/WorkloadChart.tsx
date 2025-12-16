"use client";

/**
 * Client component for Workload Distribution Bar Chart
 * 
 * This component must be client-side because Recharts requires browser APIs.
 * It receives pre-aggregated data from the server component.
 */

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
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-800">Workload Distribution</CardTitle>
        <CardDescription className="text-slate-500">
          Total hours allocated per employee
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
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
  );
}
