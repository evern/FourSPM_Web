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

// Client interface
export interface Client {
  guid: string;
  number: string;
  description: string;
  clientContact: string;
}

// Project interface
export interface Project {
  guid: string;
  projectNumber: string;
  name: string;
  purchaseOrderNumber?: string;
  projectStatus: string;
  clientGuid?: string;
  client?: Client;
  created: Date;
}

// Project status options
export const projectStatuses = [
  { id: 'TenderInProgress', name: 'Tender In Progress' },
  { id: 'TenderSubmitted', name: 'Tender Submitted' },
  { id: 'Awarded', name: 'Awarded' },
  { id: 'Closed', name: 'Closed' },
  { id: 'Cancelled', name: 'Cancelled' }
];
