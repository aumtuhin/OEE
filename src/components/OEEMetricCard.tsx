import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface OEEMetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  variant?: "success" | "warning" | "destructive" | "default";
  size?: "default" | "large";
}

export function OEEMetricCard({
  title,
  value,
  previousValue,
  variant = "default",
  size = "default",
}: OEEMetricCardProps) {
  const delta = previousValue !== undefined ? value - previousValue : null;
  const isLarge = size === "large";

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success/30 bg-success/5";
      case "warning":
        return "border-warning/30 bg-warning/5";
      case "destructive":
        return "border-destructive/30 bg-destructive/5";
      default:
        return "";
    }
  };

  const getValueColor = () => {
    switch (variant) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "destructive":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", getVariantStyles())}>
      <CardHeader className={cn("pb-2", isLarge ? "pb-3" : "")}>
        <CardTitle
          className={cn("text-sm font-medium", isLarge ? "text-base" : "")}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div
            className={cn(
              "font-bold",
              isLarge ? "text-5xl" : "text-3xl",
              getValueColor()
            )}
          >
            {value.toFixed(1)}
            <span className="text-xl ml-1">%</span>
          </div>
          {delta !== null && (
            <div className="flex items-center gap-1 text-sm">
              {delta > 0 ? (
                <>
                  <ArrowUp className="h-4 w-4 text-success" />
                  <span className="text-success font-medium">
                    +{delta.toFixed(1)}%
                  </span>
                </>
              ) : delta < 0 ? (
                <>
                  <ArrowDown className="h-4 w-4 text-destructive" />
                  <span className="text-destructive font-medium">
                    {delta.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">0%</span>
                </>
              )}
            </div>
          )}
        </div>
        {delta !== null && (
          <p className="text-xs text-muted-foreground mt-2">
            vs. previous period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
