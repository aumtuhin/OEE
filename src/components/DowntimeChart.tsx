import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DowntimeEvent } from "@/types/production";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DowntimeChartProps {
  downtimeEvents: DowntimeEvent[];
}

export function DowntimeChart({ downtimeEvents }: DowntimeChartProps) {
  // Aggregate downtime by category
  const categoryMap = new Map<string, { planned: number; unplanned: number }>();

  downtimeEvents.forEach((event) => {
    const existing = categoryMap.get(event.category) || { planned: 0, unplanned: 0 };
    if (event.type === "planned") {
      existing.planned += event.durationMinutes;
    } else {
      existing.unplanned += event.durationMinutes;
    }
    categoryMap.set(event.category, existing);
  });

  const chartData = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      planned: data.planned,
      unplanned: data.unplanned,
      total: data.planned + data.unplanned,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Downtime by Category (Pareto Analysis)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="category" 
              angle={-45}
              textAnchor="end"
              height={100}
              className="text-xs"
            />
            <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar dataKey="planned" stackId="a" fill="hsl(var(--chart-1))" name="Planned" />
            <Bar dataKey="unplanned" stackId="a" fill="hsl(var(--chart-4))" name="Unplanned" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
