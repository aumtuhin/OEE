import type {
  DowntimeEvent,
  OEEMetrics,
  ProductionData,
  Shift,
} from "@/types/production";

export const exportMetrics = (
  productionLine: ProductionData,
  selectedShift: string,
  shifts: Shift[],
  downtimeEvents: DowntimeEvent[],
  metrics: OEEMetrics
) => {
  const exportData = {
    period: selectedShift === "all" ? "All Shifts" : shifts[0]?.name,
    date: new Date().toISOString(),
    productionLine: productionLine,
    metrics,
    shifts,
    downtimeEvents,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `oee-report-${selectedShift}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
