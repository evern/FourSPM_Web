/**
 * Permission constants used throughout the application
 * This file serves as a single source of truth for all permission strings
 */

export const PERMISSIONS = {
  // Project-related permissions
  PROJECTS: {
    VIEW: 'projects.view',
    EDIT: 'projects.edit',
    DELETE: 'projects.delete',
    CREATE: 'projects.create'
  },
  
  // Client-related permissions
  CLIENTS: {
    VIEW: 'clients.view',
    EDIT: 'clients.edit',
    DELETE: 'clients.delete',
    CREATE: 'clients.create'
  },
  
  // Deliverable-related permissions
  DELIVERABLES: {
    VIEW: 'deliverables.view',
    EDIT: 'deliverables.edit',
    APPROVE: 'deliverables.approve',
    CREATE: 'deliverables.create',
    DELETE: 'deliverables.delete'
  },
  
  // Area-related permissions
  AREAS: {
    VIEW: 'areas.view',
    EDIT: 'areas.edit',
    CREATE: 'areas.create',
    DELETE: 'areas.delete'
  },
  
  // Discipline-related permissions
  DISCIPLINES: {
    VIEW: 'disciplines.view',
    EDIT: 'disciplines.edit',
    CREATE: 'disciplines.create',
    DELETE: 'disciplines.delete'
  },
  
  // Document-type-related permissions
  DOCUMENT_TYPES: {
    VIEW: 'document-types.view',
    EDIT: 'document-types.edit',
    CREATE: 'document-types.create',
    DELETE: 'document-types.delete'
  },
  
  // Variation-related permissions
  VARIATIONS: {
    VIEW: 'variations.view',
    EDIT: 'variations.edit',
    CREATE: 'variations.create',
    DELETE: 'variations.delete',
    APPROVE: 'variations.approve'
  },
  
  // Role-related permissions
  ROLES: {
    VIEW: 'roles.view',
    EDIT: 'roles.edit',
    CREATE: 'roles.create',
    DELETE: 'roles.delete',
    ASSIGN: 'roles.assign'
  },
  
  // Admin-related permissions
  ADMIN: {
    ACCESS: 'admin.access',
    SETTINGS: 'admin.settings',
    USER_MANAGEMENT: 'admin.user-management'
  }
};
