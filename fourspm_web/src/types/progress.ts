// Shared progress tracking types
// Deliverable gates
export interface DeliverableGate {
  guid: string;
  name: string;
  maxPercentage: number;
  autoPercentage: number | null;
}

// Progress data
export interface ProgressHistory {
  guid: string;
  period: number;
  units: number;
  createdDate: Date;
  createdBy: string;
}

// Row data types
export interface DeliverableRowData {
  guid: string;
  name: string;
  description?: string;
  totalPercentageEarnt: number;
  deliverableGateGuid: string;
  totalHours?: number;
  projectGuid: string;
  previousPeriodEarntPercentage?: number; // Percentage earned in previous periods
  futurePeriodEarntPercentage?: number;   // Percentage earned in future periods
  cumulativeEarntPercentage?: number;     // Cumulative percentage earned up to and including current period
  currentPeriodEarntPercentage?: number;  // Percentage earned specifically in the current period
  currentPeriodEarntHours?: number;       // Hours earned in the current period
}
