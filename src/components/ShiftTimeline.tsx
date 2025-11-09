import type { Shift, DowntimeEvent } from "@/types/production";
import { parseISO, differenceInMinutes } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShiftTimelineProps {
  shift: Shift;
  downtimeEvents: DowntimeEvent[];
}

interface TimelineSegment {
  type: "production" | "planned" | "unplanned";
  start: number;
  duration: number;
  label?: string;
  reason?: string;
}

export function ShiftTimeline({ shift, downtimeEvents }: ShiftTimelineProps) {
  const shiftStart = parseISO(shift.startTime);
  const shiftEnd = parseISO(shift.endTime);
  const totalMinutes = differenceInMinutes(shiftEnd, shiftStart);

  // Sort downtime events by start time
  const sortedEvents = [...downtimeEvents].sort((a, b) => 
    parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
  );

  // Build timeline segments
  const segments: TimelineSegment[] = [];
  let currentTime = shiftStart;

  sortedEvents.forEach((event) => {
    const eventStart = parseISO(event.startTime);
    const eventEnd = parseISO(event.endTime);

    // Add production segment before this downtime
    const productionDuration = differenceInMinutes(eventStart, currentTime);
    if (productionDuration > 0) {
      segments.push({
        type: "production",
        start: differenceInMinutes(currentTime, shiftStart),
        duration: productionDuration,
      });
    }

    // Add downtime segment
    segments.push({
      type: event.type,
      start: differenceInMinutes(eventStart, shiftStart),
      duration: event.durationMinutes,
      label: event.category,
      reason: event.reason,
    });

    currentTime = eventEnd;
  });

  // Add final production segment
  const finalProductionDuration = differenceInMinutes(shiftEnd, currentTime);
  if (finalProductionDuration > 0) {
    segments.push({
      type: "production",
      start: differenceInMinutes(currentTime, shiftStart),
      duration: finalProductionDuration,
    });
  }

  const getSegmentColor = (type: string) => {
    switch (type) {
      case "production":
        return "bg-blue-500";
      case "planned":
        return "bg-green-500";
      case "unplanned":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const getSegmentLabel = (type: string) => {
    switch (type) {
      case "production":
        return "Production";
      case "planned":
        return "Planned Downtime";
      case "unplanned":
        return "Unplanned Downtime";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{shift.name} Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            {/* Timeline bar */}
            <div className="space-y-2">
              <div className="relative h-12 bg-muted rounded-md overflow-hidden">
                {segments.map((segment, index) => {
                  const widthPercent = (segment.duration / totalMinutes) * 100;
                  const leftPercent = (segment.start / totalMinutes) * 100;

                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div
                          className={`absolute top-0 h-full ${getSegmentColor(segment.type)} border-r border-background cursor-pointer hover:opacity-80 transition-opacity`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p className="font-semibold">{getSegmentLabel(segment.type)}</p>
                          <p className="text-muted-foreground">{segment.duration} min</p>
                          {segment.label && <p className="mt-1">{segment.label}</p>}
                          {segment.reason && <p className="text-muted-foreground text-xs">{segment.reason}</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
              
              {/* Time labels */}
              <div className="relative h-5">
                {Array.from({ length: Math.floor(totalMinutes / 60) + 1 }, (_, i) => {
                  const hour = new Date(shiftStart.getTime() + i * 60 * 60 * 1000);
                  const position = (i * 60 / totalMinutes) * 100;
                  
                  return (
                    <div
                      key={i}
                      className="absolute text-xs text-muted-foreground"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      {hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-chart-1" />
                <span className="text-muted-foreground">Production</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-chart-2" />
                <span className="text-muted-foreground">Planned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-chart-4" />
                <span className="text-muted-foreground">Unplanned</span>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
