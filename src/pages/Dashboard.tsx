import { useState, useMemo } from "react";
import productionData from "@/data/production-data.json";
import type { ProductionData } from "@/types/production";
import {
  calculateOEE,
  getOEEStatus,
  getTopDowntimeReasons,
} from "@/lib/oeeCalculations";

//components
import { Button } from "@/components/ui/button";
import { Download, Factory} from "lucide-react";
import { exportMetrics } from "@/lib/exportMetrics";
import { OEEMetricCard } from "@/components/OEEMetricCard";
import { DowntimeAnalysis } from "@/components/DowntimeAnalysis";
import { ShiftSelector } from "@/components/ShiftSelector";
import { DowntimeChart } from "@/components/DowntimeChart";
import { ProductionSummary } from "@/components/ProductionSummary";
import { ShiftTimeline } from "@/components/ShiftTimeline";

const Dashboard = () => {
  const data = productionData as ProductionData;
  const [selectedShift, setSelectedShift] = useState<string>("all");

  // Get selected shifts and downtime events
  const { shifts, downtimeEvents } = useMemo(() => {
    if (selectedShift === "all") {
      return {
        shifts: data.shifts,
        downtimeEvents: data.downtimeEvents,
      };
    }
    const shift = data.shifts.find((s) => s.id === selectedShift);
    return {
      shifts: shift ? [shift] : [],
      downtimeEvents: data.downtimeEvents.filter(
        (e) => e.shiftId === selectedShift
      ),
    };
  }, [selectedShift, data.shifts, data.downtimeEvents]);

  // Calculate OEE metrics
  const metrics = useMemo(() => {
    return calculateOEE(shifts, downtimeEvents, data.productionLine);
  }, [shifts, downtimeEvents, data.productionLine]);

  const oeeStatus = getOEEStatus(metrics.oee);
  const topDowntime = getTopDowntimeReasons(downtimeEvents, 3);

  const handleExport = () => {
    exportMetrics(data, selectedShift, shifts, downtimeEvents, metrics);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Factory className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Production Line OEE Dashboard
                </h1>
                <p className="text-muted-foreground">
                  {data.productionLine.name} (<span>{data.metadata.site}</span>)
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">
                {selectedShift.toUpperCase()}: {data.metadata.reportDate}
              </p>
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Shift Selector */}
          <ShiftSelector
            shifts={data.shifts}
            selectedShift={selectedShift}
            onShiftChange={setSelectedShift}
          />

          {/* OEE Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <OEEMetricCard
              title="Overall Equipment Effectiveness"
              value={metrics.oee}
              previousValue={data.previousPeriod.totalOEE * 100}
              variant={oeeStatus}
              size="large"
            />
            <OEEMetricCard
              title="Availability"
              value={metrics.availability}
              previousValue={data.previousPeriod.availability * 100}
            />
            <OEEMetricCard
              title="Performance"
              value={metrics.performance}
              previousValue={data.previousPeriod.performance * 100}
            />
            <OEEMetricCard
              title="Quality"
              value={metrics.quality}
              previousValue={data.previousPeriod.quality * 100}
            />
          </div>

          {/* Production Summary */}
          <ProductionSummary shifts={shifts} downtimeEvents={downtimeEvents} />

          {/* Shift Timelines */}
          {selectedShift === "all" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {data.shifts.map((shift) => (
                <ShiftTimeline
                  key={shift.id}
                  shift={shift}
                  downtimeEvents={data.downtimeEvents.filter((e) => e.shiftId === shift.id)}
                />
              ))}
            </div>
          ) : (
            shifts.length > 0 && (
              <ShiftTimeline shift={shifts[0]} downtimeEvents={downtimeEvents} />
            )
          )}

          {/* Downtime Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DowntimeAnalysis topDowntimeEvents={topDowntime} />
            <DowntimeChart downtimeEvents={downtimeEvents} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
