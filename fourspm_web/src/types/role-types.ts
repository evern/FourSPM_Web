/**
 * Types for the role management functionality
 */

/**
 * Role entity interface
 */
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Role creation input parameters
 */
export interface RoleCreateParams {
  name: string;
  description: string;
  permissions?: string[];
}

/**
 * Role update input parameters
 */
export interface RoleUpdateParams {
  id: string;
  name?: string;
  description?: string;
  permissions?: string[];
}

/**
 * System role types (pre-defined roles)
 */
export enum SystemRoleType {
  ADMIN = 'Application.Admin',
  USER = 'Application.User',
  MANAGER = 'Application.Manager',
  VIEWER = 'Application.Viewer'
}

/**
 * Status of a role assignment operation
 */
export interface RoleAssignmentResult {
  success: boolean;
  userId: string;
  roleId: string;
  message?: string;
}
