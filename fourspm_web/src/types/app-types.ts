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
