import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shift, DowntimeEvent } from "@/types/production";
import { Package, Target, CheckCircle, XCircle, Clock } from "lucide-react";

interface ProductionSummaryProps {
  shifts: Shift[];
  downtimeEvents: DowntimeEvent[];
}

export function ProductionSummary({ shifts, downtimeEvents }: ProductionSummaryProps) {
  const totalTarget = shifts.reduce((sum, s) => sum + s.targetQuantity, 0);
  const totalActual = shifts.reduce((sum, s) => sum + s.actualQuantity, 0);
  const totalGood = shifts.reduce((sum, s) => sum + s.goodQuantity, 0);
  const totalDefects = shifts.reduce((sum, s) => sum + s.defectQuantity, 0);
  const totalDowntime = downtimeEvents.reduce((sum, e) => sum + e.durationMinutes, 0);

  const stats = [
    {
      label: "Target Quantity",
      value: totalTarget.toLocaleString(),
      icon: Target,
      color: "text-primary",
    },
    {
      label: "Actual Quantity",
      value: totalActual.toLocaleString(),
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "Good Parts",
      value: totalGood.toLocaleString(),
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Defects",
      value: totalDefects.toLocaleString(),
      icon: XCircle,
      color: "text-destructive",
    },
    {
      label: "Total Downtime",
      value: `${totalDowntime} min`,
      icon: Clock,
      color: "text-yellow-600",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Production Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
