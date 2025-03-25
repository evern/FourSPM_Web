// Standard OData entity types that mirror backend entity models

// Client interface - mirrors backend ClientEntity.cs
export interface Client {
  guid: string;
  number: string;
  description?: string | null;
  clientContactName?: string | null;
  clientContactNumber?: string | null;
  clientContactEmail?: string | null;
  created?: Date;
  createdBy?: string;
  updated?: Date | null;
  updatedBy?: string | null;
  deleted?: Date | null;
  deletedBy?: string | null;
}

// Project interface - core project information
export interface Project {
  guid: string;
  projectNumber: string;
  name: string | null;
  purchaseOrderNumber?: string | null;
  projectStatus: string;
  clientGuid?: string | null;
  client?: Client | null;
  created: string | Date;
  createdBy?: string;
  updated?: string | null;
  updatedBy?: string | null;
  deleted?: string | null;
  deletedBy?: string | null;
  progressStart?: string | Date | null;
}

// Area interface - mirrors backend AreaEntity.cs
export interface Area {
  guid: string;
  projectGuid: string;
  number: string;
  description: string;
}

// Discipline interface - mirrors backend DisciplineEntity.cs
export interface Discipline {
  guid: string;
  code: string;
  description: string;
}

// DocumentType interface - mirrors backend DocumentTypeEntity.cs
export interface DocumentType {
  guid: string;
  code: string;
  description: string;
}

// Deliverable interface - mirrors backend DeliverableEntity.cs
export interface Deliverable {
  guid: string;
  projectGuid: string;
  areaNumber?: string;
  departmentId: number;
  discipline?: string;
  deliverableTypeId: number;
  documentType?: string;
  clientDocumentNumber?: string;
  internalDocumentNumber?: string;
  bookingCode?: string;
  description?: string;
  budgetHours?: number;
  variationHours?: number;
  totalHours?: number;
  clientNumber?: string;
  projectNumber?: string;
  created?: Date;
  createdBy?: string;
  updated?: Date | null;
  updatedBy?: string | null;
  deleted?: Date | null;
  deletedBy?: string | null;
}

// DeliverableGate interface - mirrors backend DeliverableGateEntity.cs
export interface DeliverableGate {
  guid: string;
  name: string;
  maxPercentage: number;
  autoPercentage: number | null;
  created?: Date;
  createdBy?: string;
  updated?: Date | null;
  updatedBy?: string | null;
  deleted?: Date | null;
  deletedBy?: string | null;
}
