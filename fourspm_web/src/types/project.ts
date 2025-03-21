// Shared project-related types for use across the application

// Project information
export interface ProjectInfo {
  guid?: string; // Optional for backward compatibility
  projectNumber: string;
  name: string;
  progressStart: Date;
  projectStatus?: string; // Status information (Active, OnHold, Complete)
}

// Project period information
export interface ProjectPeriod {
  periodNumber: number;
  startDate: Date;
  endDate: Date;
}
