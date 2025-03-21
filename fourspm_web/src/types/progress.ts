// Shared progress tracking types

// URL params
export interface ProgressParams {
  projectId: string;
}

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
}
