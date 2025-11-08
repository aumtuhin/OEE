export interface ProductionLine {
  id: string;
  name: string;
  targetCycleTime: number;
  description: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  plannedProductionTime: number;
  targetQuantity: number;
  actualQuantity: number;
  goodQuantity: number;
  defectQuantity: number;
}

export interface DowntimeEvent {
  id: string;
  shiftId: string;
  category: string;
  reason: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: "planned" | "unplanned";
}

export interface PreviousPeriod {
  description: string;
  totalOEE: number;
  availability: number;
  performance: number;
  quality: number;
}

export interface Metadata {
  site: string;
  department: string;
  reportDate: string;
  worldClassOEETarget: number;
  minimumAcceptableOEE: number;
}

export interface ProductionData {
  productionLine: ProductionLine;
  shifts: Shift[];
  downtimeEvents: DowntimeEvent[];
  previousPeriod: PreviousPeriod;
  metadata: Metadata;
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}
