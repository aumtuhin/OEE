import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DowntimeEvent } from "@/types/production";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DowntimeAnalysisProps {
  topDowntimeEvents: DowntimeEvent[];
}

export function DowntimeAnalysis({ topDowntimeEvents }: DowntimeAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Top 3 Downtime Reasons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topDowntimeEvents.map((event, index) => (
            <div
              key={event.id}
              className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{event.category}</h4>
                  <Badge
                    variant={
                      event.type === "unplanned" ? "destructive" : "secondary"
                    }
                  >
                    {event.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {event.reason}
                </p>
                <div className="flex items-center gap-1 text-sm text-foreground font-medium">
                  <Clock className="h-4 w-4" />
                  {event.durationMinutes} minutes
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
