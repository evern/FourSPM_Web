// Standard OData entity types that mirror backend entity models

// Type to represent basic entity with ID
export type Entity = {
  guid: string;
  [key: string]: any;
};

// Client interface - mirrors backend ClientEntity.cs
export interface Client extends Entity {
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
export interface Project extends Entity {
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
export interface Area extends Entity {
  projectGuid: string;
  number: string;
  description: string;
}

// Discipline interface - mirrors backend DisciplineEntity.cs
export interface Discipline extends Entity {
  code: string;
  description: string;
}

// DocumentType interface - mirrors backend DocumentTypeEntity.cs
export interface DocumentType extends Entity {
  code: string;
  description: string;
}

// Deliverable interface - mirrors backend DeliverableEntity.cs
export interface Deliverable extends Entity {
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
export interface DeliverableGate extends Entity {
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

// Variation interface - mirrors backend VariationEntity.cs
export interface Variation extends Entity {
  projectGuid: string;
  name: string;
  comments?: string;
  submitted?: Date;
  submittedBy?: string;
  clientApproved?: Date;
  clientApprovedBy?: string;
  created: Date;
  createdBy: string;
  updated?: Date;
  updatedBy?: string;
  deleted?: Date;
  deletedBy?: string;
}
