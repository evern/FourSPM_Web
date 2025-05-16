/**
 * Role adapter for converting between API and UI models
 * Following the FourSPM UI Development Guidelines and API standardization patterns
 */
import { ROLES_ENDPOINT, ROLE_PERMISSIONS_ENDPOINT } from '../config/api-endpoints';
// Import the adapter interface from the existing file
import { ODataEntityAdapter } from '../adapters/odata-entity.adapter';

// Role entity interface matching the backend model
export interface Role {
  guid: string;
  roleName: string;
  displayName?: string;
  description?: string;
  isSystemRole?: boolean;
  createdBy?: string;
  created?: Date;
  modifiedBy?: string;
  modified?: Date;
  rolePermissions?: RolePermission[];
}

// Role permission interface matching the backend model
export interface RolePermission {
  guid: string;
  roleGuid: string;
  permissionName: string;
  createdBy?: string;
  created?: Date;
  modifiedBy?: string;
  modified?: Date;
}

/**
 * Helper functions to convert between OData entities and UI models
 */
export const roleAdapter: ODataEntityAdapter<Role> = {
  /**
   * Converts an OData role entity to the UI Role model
   */
  fromOData: (oDataEntity: any): Role => ({
    guid: oDataEntity.GUID,
    roleName: oDataEntity.ROLE_NAME,
    displayName: oDataEntity.DISPLAY_NAME,
    description: oDataEntity.DESCRIPTION,
    isSystemRole: oDataEntity.IS_SYSTEM_ROLE,
    createdBy: oDataEntity.CREATED_BY,
    created: oDataEntity.CREATED ? new Date(oDataEntity.CREATED) : undefined,
    modifiedBy: oDataEntity.MODIFIED_BY,
    modified: oDataEntity.MODIFIED ? new Date(oDataEntity.MODIFIED) : undefined,
    rolePermissions: oDataEntity.RolePermissions?.map((rp: any) => ({
      guid: rp.GUID,
      roleGuid: rp.ROLE_GUID,
      permissionName: rp.PERMISSION_NAME,
      createdBy: rp.CREATED_BY,
      created: rp.CREATED ? new Date(rp.CREATED) : undefined,
      modifiedBy: rp.MODIFIED_BY,
      modified: rp.MODIFIED ? new Date(rp.MODIFIED) : undefined,
    })),
  }),

  /**
   * Converts a UI Role model to an OData entity for updates/creates
   */
  toOData: (role: Role): any => ({
    GUID: role.guid,
    ROLE_NAME: role.roleName,
    DISPLAY_NAME: role.displayName,
    DESCRIPTION: role.description,
    IS_SYSTEM_ROLE: role.isSystemRole,
    CREATED_BY: role.createdBy,
    CREATED: role.created,
    MODIFIED_BY: role.modifiedBy,
    MODIFIED: role.modified,
  }),
};

/**
 * Helper functions to convert between OData role permission entities and UI models
 */
export const rolePermissionAdapter: ODataEntityAdapter<RolePermission> = {
  /**
   * Converts an OData role permission entity to the UI RolePermission model
   */
  fromOData: (oDataEntity: any): RolePermission => ({
    guid: oDataEntity.GUID,
    roleGuid: oDataEntity.ROLE_GUID,
    permissionName: oDataEntity.PERMISSION_NAME,
    createdBy: oDataEntity.CREATED_BY,
    created: oDataEntity.CREATED ? new Date(oDataEntity.CREATED) : undefined,
    modifiedBy: oDataEntity.MODIFIED_BY,
    modified: oDataEntity.MODIFIED ? new Date(oDataEntity.MODIFIED) : undefined,
  }),

  /**
   * Converts a UI RolePermission model to an OData entity for updates/creates
   */
  toOData: (rolePermission: RolePermission): any => ({
    GUID: rolePermission.guid,
    ROLE_GUID: rolePermission.roleGuid,
    PERMISSION_NAME: rolePermission.permissionName,
    CREATED_BY: rolePermission.createdBy,
    CREATED: rolePermission.created,
    MODIFIED_BY: rolePermission.modifiedBy,
    MODIFIED: rolePermission.modified,
  }),
};

/**
 * Helper functions for role-related operations
 */
export const getRolesEndpoint = () => ROLES_ENDPOINT;

export const getRolePermissionsEndpoint = () => ROLE_PERMISSIONS_ENDPOINT;

export const getRoleByIdEndpoint = (roleId: string) => `${ROLES_ENDPOINT}(${roleId})`;

export const getRolePermissionsByRoleEndpoint = (roleId: string) => {
  return `${ROLE_PERMISSIONS_ENDPOINT}?$filter=roleGuid eq ${roleId}`;
};

/**
 * Creates a filter for permissions by role GUID
 */
export const createRolePermissionsFilter = (roleId: string): string => {
  return `roleGuid eq ${roleId}`;
};
