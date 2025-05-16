/**
 * Types for permission management functionality
 */

/**
 * Permission entity interface
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  isSystemPermission?: boolean;
}

/**
 * Role-Permission relationship interface
 */
export interface RolePermission {
  roleId: string;
  permissionId: string;
}

/**
 * Permission categories
 */
export enum PermissionCategory {
  General = 'General',
  Project = 'Project',
  Client = 'Client',
  Deliverable = 'Deliverable',
  Variation = 'Variation',
  User = 'User',
  System = 'System'
}

/**
 * Permission assignment result
 */
export interface PermissionAssignmentResult {
  success: boolean;
  roleId: string;
  permissionIds: string[];
  message?: string;
}
