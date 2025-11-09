import type { DowntimeEvent, OEEMetrics, ProductionLine, Shift } from "@/types/production";


export function calculateOEE(
  shifts: Shift[],
  downtimeEvents: DowntimeEvent[],
  productionLine: ProductionLine
): OEEMetrics {
  // Aggregate data across all shifts
  const totalPlannedTime = shifts.reduce((sum, shift) => sum + shift.plannedProductionTime, 0);
//   const totalTargetQuantity = shifts.reduce((sum, shift) => sum + shift.targetQuantity, 0);
  const totalActualQuantity = shifts.reduce((sum, shift) => sum + shift.actualQuantity, 0);
  const totalGoodQuantity = shifts.reduce((sum, shift) => sum + shift.goodQuantity, 0);

  // Calculate total downtime for these shifts
  const shiftIds = shifts.map(s => s.id);
  const relevantDowntime = downtimeEvents.filter(event => shiftIds.includes(event.shiftId));
  const totalDowntime = relevantDowntime.reduce((sum, event) => sum + event.durationMinutes, 0);

  // 1. AVAILABILITY = (Planned Production Time - Downtime) / Planned Production Time
  const runTime = totalPlannedTime - totalDowntime;
  const availability = totalPlannedTime > 0 ? (runTime / totalPlannedTime) * 100 : 0;

  // 2. PERFORMANCE = (Actual Quantity × Ideal Cycle Time) / Run Time
  // Ideal Cycle Time in minutes = targetCycleTime (seconds) / 60
  const idealCycleTimeMinutes = productionLine.targetCycleTime / 60;
  const idealRunTime = totalActualQuantity * idealCycleTimeMinutes;
  const performance = runTime > 0 ? (idealRunTime / runTime) * 100 : 0;

  // 3. QUALITY = Good Quantity / Actual Quantity
  const quality = totalActualQuantity > 0 ? (totalGoodQuantity / totalActualQuantity) * 100 : 0;

  // OEE = Availability × Performance × Quality (as percentages)
  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return {
    availability: Math.min(100, availability),
    performance: Math.min(100, performance),
    quality: Math.min(100, quality),
    oee: Math.min(100, oee),
  };
}

/**
 * Get OEE status color based on percentage
 */
export function getOEEStatus(oee: number): "success" | "warning" | "destructive" {
  if (oee >= 85) return "success";
  if (oee >= 65) return "warning";
  return "destructive";
}

/**
 * Get top N downtime events by duration
 */
export function getTopDowntimeReasons(
  downtimeEvents: DowntimeEvent[],
  limit: number = 3
): DowntimeEvent[] {
  return [...downtimeEvents]
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, limit);
}

/**
 * Calculate total downtime by type
 */
export function getDowntimeByType(downtimeEvents: DowntimeEvent[]): {
  planned: number;
  unplanned: number;
  total: number;
} {
  const planned = downtimeEvents
    .filter(e => e.type === "planned")
    .reduce((sum, e) => sum + e.durationMinutes, 0);
  
  const unplanned = downtimeEvents
    .filter(e => e.type === "unplanned")
    .reduce((sum, e) => sum + e.durationMinutes, 0);

  return {
    planned,
    unplanned,
    total: planned + unplanned,
  };
}
