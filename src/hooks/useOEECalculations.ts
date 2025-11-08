import { useMemo } from 'react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  plannedProductionTime: number; // minutes
  targetQuantity: number;
  actualQuantity: number;
  goodQuantity: number;
  defectQuantity: number;
}

interface DowntimeEvent {
  id: string;
  shiftId: string;
  category: string;
  reason: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: 'planned' | 'unplanned';
}

interface ProductionLine {
  id: string;
  name: string;
  targetCycleTime: number; // seconds
  description: string;
}

interface PreviousPeriod {
  description: string;
  totalOEE: number;
  availability: number;
  performance: number;
  quality: number;
}

interface ProductionData {
  productionLine: ProductionLine;
  shifts: Shift[];
  downtimeEvents: DowntimeEvent[];
  previousPeriod: PreviousPeriod;
  metadata: {
    site: string;
    department: string;
    reportDate: string;
    worldClassOEETarget: number;
    minimumAcceptableOEE: number;
  };
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  // Additional calculated metrics
  totalDowntime: number;
  plannedDowntime: number;
  unplannedDowntime: number;
  operatingTime: number;
  targetQuantity: number;
  actualQuantity: number;
  goodQuantity: number;
  defectQuantity: number;
  plannedProductionTime: number;
}

export interface DowntimeBreakdown {
  category: string;
  totalMinutes: number;
  percentage: number;
  eventCount: number;
  type: 'planned' | 'unplanned' | 'mixed';
}

export interface ComparisonMetrics {
  oee: {
    current: number;
    previous: number;
    delta: number;
    deltaPercentage: number;
  };
  availability: {
    current: number;
    previous: number;
    delta: number;
  };
  performance: {
    current: number;
    previous: number;
    delta: number;
  };
  quality: {
    current: number;
    previous: number;
    delta: number;
  };
}

export type ShiftFilter = 'day' | string; // 'day' or shift ID

// ============================================================================
// CORE OEE CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate OEE metrics for a single shift
 * 
 * OEE Formula:
 * - Availability = (Planned Production Time - Downtime) / Planned Production Time
 * - Performance = (Actual Quantity × Ideal Cycle Time) / Operating Time
 * - Quality = Good Quantity / Actual Quantity
 * - OEE = Availability × Performance × Quality
 */
function calculateShiftOEE(
  shift: Shift,
  downtimeEvents: DowntimeEvent[],
  targetCycleTime: number // in seconds
): OEEMetrics {
  const {
    plannedProductionTime,
    targetQuantity,
    actualQuantity,
    goodQuantity,
    defectQuantity
  } = shift;

  // Filter downtime for this shift
  const shiftDowntime = downtimeEvents.filter(e => e.shiftId === shift.id);
  
  // Calculate total downtime
  const totalDowntime = shiftDowntime.reduce((sum, e) => sum + e.durationMinutes, 0);
  const plannedDowntime = shiftDowntime
    .filter(e => e.type === 'planned')
    .reduce((sum, e) => sum + e.durationMinutes, 0);
  const unplannedDowntime = totalDowntime - plannedDowntime;

  // AVAILABILITY: (Planned Time - Downtime) / Planned Time
  const operatingTime = plannedProductionTime - totalDowntime;
  const availability = operatingTime / plannedProductionTime;

  // PERFORMANCE: (Actual Quantity × Ideal Cycle Time) / Operating Time
  // Convert cycle time from seconds to minutes
  const targetCycleTimeMinutes = targetCycleTime / 60;
  const idealProductionTime = actualQuantity * targetCycleTimeMinutes;
  
  // Guard against division by zero
  let performance = 0;
  if (operatingTime > 0) {
    performance = Math.min(idealProductionTime / operatingTime, 1); // Cap at 100%
  }

  // QUALITY: Good Quantity / Actual Quantity
  let quality = 0;
  if (actualQuantity > 0) {
    quality = goodQuantity / actualQuantity;
  }

  // OEE: A × P × Q
  const oee = availability * performance * quality;

  return {
    availability,
    performance,
    quality,
    oee,
    totalDowntime,
    plannedDowntime,
    unplannedDowntime,
    operatingTime,
    targetQuantity,
    actualQuantity,
    goodQuantity,
    defectQuantity,
    plannedProductionTime
  };
}

/**
 * Calculate aggregated OEE metrics for multiple shifts (full day)
 */
function calculateDayOEE(
  shifts: Shift[],
  downtimeEvents: DowntimeEvent[],
  targetCycleTime: number
): OEEMetrics {
  // Aggregate all shift data
  const totalPlannedTime = shifts.reduce((sum, s) => sum + s.plannedProductionTime, 0);
  const totalTargetQuantity = shifts.reduce((sum, s) => sum + s.targetQuantity, 0);
  const totalActualQuantity = shifts.reduce((sum, s) => sum + s.actualQuantity, 0);
  const totalGoodQuantity = shifts.reduce((sum, s) => sum + s.goodQuantity, 0);
  const totalDefectQuantity = shifts.reduce((sum, s) => sum + s.defectQuantity, 0);

  // Calculate total downtime
  const totalDowntime = downtimeEvents.reduce((sum, e) => sum + e.durationMinutes, 0);
  const plannedDowntime = downtimeEvents
    .filter(e => e.type === 'planned')
    .reduce((sum, e) => sum + e.durationMinutes, 0);
  const unplannedDowntime = totalDowntime - plannedDowntime;

  // AVAILABILITY
  const operatingTime = totalPlannedTime - totalDowntime;
  const availability = operatingTime / totalPlannedTime;

  // PERFORMANCE
  const targetCycleTimeMinutes = targetCycleTime / 60;
  const idealProductionTime = totalActualQuantity * targetCycleTimeMinutes;
  
  let performance = 0;
  if (operatingTime > 0) {
    performance = Math.min(idealProductionTime / operatingTime, 1);
  }

  // QUALITY
  let quality = 0;
  if (totalActualQuantity > 0) {
    quality = totalGoodQuantity / totalActualQuantity;
  }

  // OEE
  const oee = availability * performance * quality;

  return {
    availability,
    performance,
    quality,
    oee,
    totalDowntime,
    plannedDowntime,
    unplannedDowntime,
    operatingTime,
    targetQuantity: totalTargetQuantity,
    actualQuantity: totalActualQuantity,
    goodQuantity: totalGoodQuantity,
    defectQuantity: totalDefectQuantity,
    plannedProductionTime: totalPlannedTime
  };
}

/**
 * Get top N downtime reasons sorted by duration
 */
function getTopDowntimeReasons(
  downtimeEvents: DowntimeEvent[],
  limit: number = 3
): Array<{ reason: string; category: string; duration: number; type: string }> {
  // Sort by duration descending
  const sorted = [...downtimeEvents].sort((a, b) => b.durationMinutes - a.durationMinutes);
  
  return sorted.slice(0, limit).map(event => ({
    reason: event.reason,
    category: event.category,
    duration: event.durationMinutes,
    type: event.type
  }));
}

/**
 * Get downtime breakdown by category (for Pareto analysis)
 */
function getDowntimeBreakdown(downtimeEvents: DowntimeEvent[]): DowntimeBreakdown[] {
  const totalDowntime = downtimeEvents.reduce((sum, e) => sum + e.durationMinutes, 0);
  
  // Group by category
  const categoryMap = new Map<string, {
    minutes: number;
    count: number;
    types: Set<string>;
  }>();

  downtimeEvents.forEach(event => {
    const existing = categoryMap.get(event.category) || {
      minutes: 0,
      count: 0,
      types: new Set()
    };
    
    existing.minutes += event.durationMinutes;
    existing.count += 1;
    existing.types.add(event.type);
    
    categoryMap.set(event.category, existing);
  });

  // Convert to array and calculate percentages
  const breakdown: DowntimeBreakdown[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      totalMinutes: data.minutes,
      percentage: totalDowntime > 0 ? (data.minutes / totalDowntime) * 100 : 0,
      eventCount: data.count,
      type: data.types.size === 1 
        ? Array.from(data.types)[0] as 'planned' | 'unplanned'
        : 'mixed'
    })
  );

  // Sort by duration descending
  return breakdown.sort((a, b) => b.totalMinutes - a.totalMinutes);
}

/**
 * Calculate comparison metrics vs previous period
 */
function calculateComparison(
  current: OEEMetrics,
  previous: PreviousPeriod
): ComparisonMetrics {
  const calculateDelta = (current: number, previous: number) => {
    const delta = current - previous;
    const deltaPercentage = previous > 0 ? (delta / previous) * 100 : 0;
    return { delta, deltaPercentage };
  };

  const oeeDelta = calculateDelta(current.oee, previous.totalOEE);

  return {
    oee: {
      current: current.oee,
      previous: previous.totalOEE,
      delta: oeeDelta.delta,
      deltaPercentage: oeeDelta.deltaPercentage
    },
    availability: {
      current: current.availability,
      previous: previous.availability,
      delta: current.availability - previous.availability
    },
    performance: {
      current: current.performance,
      previous: previous.performance,
      delta: current.performance - previous.performance
    },
    quality: {
      current: current.quality,
      previous: previous.quality,
      delta: current.quality - previous.quality
    }
  };
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export interface UseOEECalculationsResult {
  // Current metrics
  currentMetrics: OEEMetrics;
  
  // Comparison with previous period
  comparison: ComparisonMetrics;
  
  // Top downtime reasons
  topDowntimeReasons: Array<{
    reason: string;
    category: string;
    duration: number;
    type: string;
  }>;
  
  // Downtime breakdown for Pareto analysis
  downtimeBreakdown: DowntimeBreakdown[];
  
  // Individual shift metrics (for shift comparison)
  shiftMetrics: Map<string, OEEMetrics>;
  
  // Metadata
  metadata: {
    worldClassTarget: number;
    minimumAcceptable: number;
    isWorldClass: boolean;
    isAcceptable: boolean;
    status: 'world-class' | 'acceptable' | 'needs-attention';
  };
}

/**
 * Custom hook for OEE calculations
 * 
 * @param data - Production data from JSON
 * @param selectedShift - Either 'day' for full day or a specific shift ID
 * @returns Calculated OEE metrics and related data
 */
export function useOEECalculations(
  data: ProductionData | null,
  selectedShift: ShiftFilter = 'day'
): UseOEECalculationsResult | null {
  return useMemo(() => {
    if (!data) return null;

    const { productionLine, shifts, downtimeEvents, previousPeriod, metadata } = data;
    const targetCycleTime = productionLine.targetCycleTime;

    // Calculate metrics based on filter
    let currentMetrics: OEEMetrics;
    let relevantDowntime: DowntimeEvent[];

    if (selectedShift === 'day') {
      // Calculate for entire day
      currentMetrics = calculateDayOEE(shifts, downtimeEvents, targetCycleTime);
      relevantDowntime = downtimeEvents;
    } else {
      // Calculate for specific shift
      const shift = shifts.find(s => s.id === selectedShift);
      if (!shift) {
        console.error(`Shift ${selectedShift} not found`);
        return null;
      }
      
      relevantDowntime = downtimeEvents.filter(e => e.shiftId === selectedShift);
      currentMetrics = calculateShiftOEE(shift, downtimeEvents, targetCycleTime);
    }

    // Calculate individual shift metrics for comparison
    const shiftMetrics = new Map<string, OEEMetrics>();
    shifts.forEach(shift => {
      const metrics = calculateShiftOEE(shift, downtimeEvents, targetCycleTime);
      shiftMetrics.set(shift.id, metrics);
    });

    // Get top downtime reasons
    const topDowntimeReasons = getTopDowntimeReasons(relevantDowntime, 3);

    // Get downtime breakdown
    const downtimeBreakdown = getDowntimeBreakdown(relevantDowntime);

    // Calculate comparison with previous period
    const comparison = calculateComparison(currentMetrics, previousPeriod);

    // Determine OEE status
    const isWorldClass = currentMetrics.oee >= metadata.worldClassOEETarget;
    const isAcceptable = currentMetrics.oee >= metadata.minimumAcceptableOEE;
    
    let status: 'world-class' | 'acceptable' | 'needs-attention';
    if (isWorldClass) {
      status = 'world-class';
    } else if (isAcceptable) {
      status = 'acceptable';
    } else {
      status = 'needs-attention';
    }

    return {
      currentMetrics,
      comparison,
      topDowntimeReasons,
      downtimeBreakdown,
      shiftMetrics,
      metadata: {
        worldClassTarget: metadata.worldClassOEETarget,
        minimumAcceptable: metadata.minimumAcceptableOEE,
        isWorldClass,
        isAcceptable,
        status
      }
    };
  }, [data, selectedShift]);
}

// ============================================================================
// HELPER FUNCTIONS (Export for use in components)
// ============================================================================

/**
 * Format OEE percentage for display
 * @param value - OEE value as decimal (0.753 = 75.3%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string like "75.3%"
 * 
 * @example
 * formatOEEPercentage(0.753) // "75.3%"
 * formatOEEPercentage(0.85, 2) // "85.00%"
 * formatOEEPercentage(0.5) // "50.0%"
 */
export function formatOEEPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0.0%';
  }
  
  const percentage = value * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format duration in minutes to human-readable format
 * @param minutes - Duration in minutes
 * @returns Formatted string like "2h 15m" or "45m"
 * 
 * @example
 * formatDuration(135) // "2h 15m"
 * formatDuration(45) // "45m"
 * formatDuration(90) // "1h 30m"
 * formatDuration(0) // "0m"
 * formatDuration(1440) // "24h 0m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0 || isNaN(minutes)) {
    return '0m';
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * Get Tailwind CSS color classes based on OEE status
 * @param oee - OEE value as decimal
 * @param worldClassTarget - Threshold for world-class (default: 0.85)
 * @param minimumAcceptable - Threshold for acceptable (default: 0.65)
 * @returns Object with text, background, and border color classes
 * 
 * @example
 * getOEEColorClass(0.87) 
 * // { text: "text-green-600", bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100" }
 * 
 * getOEEColorClass(0.72)
 * // { text: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", badge: "bg-yellow-100" }
 * 
 * getOEEColorClass(0.55)
 * // { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100" }
 */
export function getOEEColorClass(
  oee: number,
  worldClassTarget: number = 0.85,
  minimumAcceptable: number = 0.65
): {
  text: string;
  bg: string;
  border: string;
  badge: string;
  progress: string;
} {
  if (oee >= worldClassTarget) {
    return {
      text: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      badge: 'bg-green-100',
      progress: 'bg-green-500'
    };
  } else if (oee >= minimumAcceptable) {
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100',
      progress: 'bg-yellow-500'
    };
  } else {
    return {
      text: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100',
      progress: 'bg-red-500'
    };
  }
}

/**
 * Get human-readable status label based on OEE value
 * @param oee - OEE value as decimal
 * @param worldClassTarget - Threshold for world-class (default: 0.85)
 * @param minimumAcceptable - Threshold for acceptable (default: 0.65)
 * @returns Status label string
 * 
 * @example
 * getOEEStatusLabel(0.87) // "World-Class"
 * getOEEStatusLabel(0.72) // "Acceptable"
 * getOEEStatusLabel(0.55) // "Needs Attention"
 */
export function getOEEStatusLabel(
  oee: number,
  worldClassTarget: number = 0.85,
  minimumAcceptable: number = 0.65
): string {
  if (oee >= worldClassTarget) {
    return 'World-Class';
  } else if (oee >= minimumAcceptable) {
    return 'Acceptable';
  } else {
    return 'Needs Attention';
  }
}

/**
 * Format percentage change with sign for display
 * @param delta - Change in value as decimal (0.053 = +5.3%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with sign like "+5.3%" or "-2.1%"
 * 
 * @example
 * formatPercentageChange(0.053) // "+5.3%"
 * formatPercentageChange(-0.021) // "-2.1%"
 * formatPercentageChange(0) // "0.0%"
 * formatPercentageChange(0.1234, 2) // "+12.34%"
 */
export function formatPercentageChange(delta: number, decimals: number = 1): string {
  if (isNaN(delta) || !isFinite(delta)) {
    return '0.0%';
  }
  
  const percentage = delta * 100;
  const sign = percentage > 0 ? '+' : '';
  
  return `${sign}${percentage.toFixed(decimals)}%`;
}

/**
 * Get trend indicator (arrow) based on change
 * @param delta - Change value (positive or negative)
 * @returns Object with arrow symbol and color class
 * 
 * @example
 * getTrendIndicator(0.05) // { arrow: "↑", color: "text-green-600", label: "improvement" }
 * getTrendIndicator(-0.03) // { arrow: "↓", color: "text-red-600", label: "decline" }
 * getTrendIndicator(0) // { arrow: "→", color: "text-gray-600", label: "unchanged" }
 */
export function getTrendIndicator(delta: number): {
  arrow: string;
  color: string;
  label: string;
} {
  if (delta > 0.001) { // More than 0.1% improvement
    return {
      arrow: '↑',
      color: 'text-green-600',
      label: 'improvement'
    };
  } else if (delta < -0.001) { // More than 0.1% decline
    return {
      arrow: '↓',
      color: 'text-red-600',
      label: 'decline'
    };
  } else {
    return {
      arrow: '→',
      color: 'text-gray-600',
      label: 'unchanged'
    };
  }
}

/**
 * Format number with thousand separators
 * @param value - Number to format
 * @returns Formatted string like "1,234" or "567"
 * 
 * @example
 * formatNumber(1234) // "1,234"
 * formatNumber(567) // "567"
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(value: number): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0';
  }
  
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Calculate production rate (parts per hour)
 * @param quantity - Number of parts produced
 * @param timeMinutes - Time in minutes
 * @returns Parts per hour
 * 
 * @example
 * calculateProductionRate(582, 480) // 72.75 parts/hour
 */
export function calculateProductionRate(quantity: number, timeMinutes: number): number {
  if (timeMinutes <= 0) {
    return 0;
  }
  
  return (quantity / timeMinutes) * 60;
}

/**
 * Format production rate for display
 * @param rate - Parts per hour
 * @returns Formatted string like "72.8 parts/hr"
 * 
 * @example
 * formatProductionRate(72.75) // "72.8 parts/hr"
 */
export function formatProductionRate(rate: number): string {
  if (isNaN(rate) || !isFinite(rate)) {
    return '0.0 parts/hr';
  }
  
  return `${rate.toFixed(1)} parts/hr`;
}

/**
 * Get relative time description
 * @param date - ISO date string
 * @returns Human-readable relative time
 * 
 * @example
 * getRelativeTime("2025-10-27T08:15:00Z") // "2 hours ago" (depending on current time)
 */
export function getRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}