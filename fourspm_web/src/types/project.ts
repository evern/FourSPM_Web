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

// Project navigation item interface
export interface ProjectNavigationItem {
  guid: string;
  projectNumber: string;
  name: string;
  projectStatus: string;
}

// Detailed client information
export interface ClientDetails {
  guid: string;
  number: string;
  description: string;
  clientContact: string | null;
}

// Detailed project information
export interface ProjectDetails {
  guid: string;
  clientGuid: string | null;
  projectNumber: string;
  name: string | null;
  purchaseOrderNumber: string | null;
  projectStatus: string;
  progressStart: string | null;
  created: string;
  createdBy: string;
  updated: string | null;
  updatedBy: string | null;
  deleted: string | null;
  deletedBy: string | null;
  client?: ClientDetails | null;
  // Additional client contact fields that may exist directly on project object
  clientContactName?: string | null;
  clientContactNumber?: string | null;
  clientContactEmail?: string | null;
}

// Project status options
export const projectStatuses = [
  { id: 'TenderInProgress', name: 'Tender In Progress' },
  { id: 'TenderSubmitted', name: 'Tender Submitted' },
  { id: 'Awarded', name: 'Awarded' },
  { id: 'Closed', name: 'Closed' },
  { id: 'Cancelled', name: 'Cancelled' }
];
