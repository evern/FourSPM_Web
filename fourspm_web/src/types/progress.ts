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
  previousPeriodEarnedPercentage?: number; // Added for tracking percentage earned in previous periods
  futurePeriodEarnedPercentage?: number;   // Added for tracking percentage earned in future periods
  periodPercentageEarnt?: number;          // Added for tracking percentage earned in current period
  periodEarntHours?: number;               // Hours earned in the current period
}
