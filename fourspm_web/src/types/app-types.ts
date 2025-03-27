// Project period information
export interface ProjectPeriod {
  periodNumber: number;
  startDate: Date;
  endDate: Date;
}

// Project navigation item interface - simplified project for navigation
export interface ProjectNavigationItem {
  guid: string;
  projectNumber: string;
  name: string;
  projectStatus: string;
}

// OData response format for DevExtreme data sources
export interface ODataResponse<T> {
  value: T[];
  '@odata.count'?: number;
}

// Generic lookup item interface
export interface LookupItem {
  id: string | number;
  name: string;
}

/**
 * Data Transfer Object for deliverable progress information
 * Combines deliverable data with calculated progress values for UI consumption
 */
export interface DeliverableProgressDto {
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
