/**
 * Permission and role configuration constants
 * This file centralizes all permission names and role-related constants
 * to ensure consistency across the application
 */

// Standard permission types
export enum PermissionType {
  VIEW = 'View',
  CREATE = 'Create',
  EDIT = 'Edit',
  DELETE = 'Delete',
  APPROVE = 'Approve',
  ADMIN = 'Admin'
}

// Feature areas that permissions apply to
export enum FeatureArea {
  PROJECTS = 'Projects',
  DELIVERABLES = 'Deliverables',
  CLIENTS = 'Clients',
  DISCIPLINES = 'Disciplines',
  AREAS = 'Areas',
  USERS = 'Users',
  ROLES = 'Roles',
  SYSTEM = 'System'
}

// Standard system roles
export enum SystemRoles {
  ADMINISTRATOR = 'Administrator',
  PROJECT_MANAGER = 'Project Manager',
  TEAM_MEMBER = 'Team Member',
  CLIENT = 'Client',
  GUEST = 'Guest'
}

/**
 * Helper function to create standardized permission names
 * in the format "[FeatureArea].[PermissionType]"
 */
export const createPermissionName = (
  featureArea: FeatureArea,
  permissionType: PermissionType
): string => {
  return `${featureArea}.${permissionType}`;
};

// Common permissions used throughout the application
export const CommonPermissions = {
  // Project permissions
  VIEW_PROJECTS: createPermissionName(FeatureArea.PROJECTS, PermissionType.VIEW),
  CREATE_PROJECTS: createPermissionName(FeatureArea.PROJECTS, PermissionType.CREATE),
  EDIT_PROJECTS: createPermissionName(FeatureArea.PROJECTS, PermissionType.EDIT),
  DELETE_PROJECTS: createPermissionName(FeatureArea.PROJECTS, PermissionType.DELETE),
  
  // Deliverable permissions
  VIEW_DELIVERABLES: createPermissionName(FeatureArea.DELIVERABLES, PermissionType.VIEW),
  CREATE_DELIVERABLES: createPermissionName(FeatureArea.DELIVERABLES, PermissionType.CREATE),
  EDIT_DELIVERABLES: createPermissionName(FeatureArea.DELIVERABLES, PermissionType.EDIT),
  DELETE_DELIVERABLES: createPermissionName(FeatureArea.DELIVERABLES, PermissionType.DELETE),
  
  // User permissions
  VIEW_USERS: createPermissionName(FeatureArea.USERS, PermissionType.VIEW),
  CREATE_USERS: createPermissionName(FeatureArea.USERS, PermissionType.CREATE),
  EDIT_USERS: createPermissionName(FeatureArea.USERS, PermissionType.EDIT),
  DELETE_USERS: createPermissionName(FeatureArea.USERS, PermissionType.DELETE),
  
  // Role management permissions
  VIEW_ROLES: createPermissionName(FeatureArea.ROLES, PermissionType.VIEW),
  CREATE_ROLES: createPermissionName(FeatureArea.ROLES, PermissionType.CREATE),
  EDIT_ROLES: createPermissionName(FeatureArea.ROLES, PermissionType.EDIT),
  DELETE_ROLES: createPermissionName(FeatureArea.ROLES, PermissionType.DELETE),
  
  // System permissions
  SYSTEM_ADMIN: createPermissionName(FeatureArea.SYSTEM, PermissionType.ADMIN)
};
