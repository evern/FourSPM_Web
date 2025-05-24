import { StaticPermission, RolePermission, Role } from '../contexts/permissions/permissions-types';
import { STATIC_PERMISSIONS_ENDPOINT, ROLE_PERMISSIONS_ENDPOINT, ROLES_ENDPOINT } from '../config/api-endpoints';
import { getToken } from '../utils/token-store';
import { baseApiService } from '../api/base-api.service';

/**
 * Fetch all static permissions from the backend
 * These are the available permissions that can be assigned to roles
 */
export const fetchStaticPermissions = async (token?: string): Promise<StaticPermission[]> => {
  try {
    // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
    const authToken = token || getToken();
    
    if (!authToken) {
      throw new Error('Authentication token is required for fetching static permissions');
    }
    
    const response = await baseApiService.request(STATIC_PERMISSIONS_ENDPOINT, {
      method: 'GET',
      token: authToken
    });
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error fetching static permissions:', error);
    throw error;
  }
};

/**
 * Fetch permissions assigned to a specific role
 * @param roleGuid The GUID of the role
 */
export const fetchRolePermissions = async (roleGuid: string, token?: string): Promise<RolePermission[]> => {
  try {
    // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
    const authToken = token || getToken();
    
    if (!authToken) {
      throw new Error('Authentication token is required for fetching role permissions');
    }
    
    // Using OData filter to get permissions for a specific role
    const url = `${ROLE_PERMISSIONS_ENDPOINT}?$filter=roleGuid eq ${roleGuid} and deleted eq null`;
    
    const response = await baseApiService.request(url, {
      method: 'GET',
      token: authToken
    });
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleGuid}:`, error);
    throw error;
  }
};

/**
 * Add a permission to a role
 * @param roleGuid The GUID of the role
 * @param permission The permission string to add
 */
export const addPermissionToRole = async (roleGuid: string, permission: string, token?: string): Promise<RolePermission> => {
  try {
    // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
    const authToken = token || getToken();
    
    if (!authToken) {
      throw new Error('Authentication token is required for adding role permissions');
    }
    
    // Create a new role permission entity
    const rolePermission = {
      roleGuid,
      permission
    };
    
    const response = await baseApiService.request(ROLE_PERMISSIONS_ENDPOINT, {
      method: 'POST',
      token: authToken,
      body: JSON.stringify(rolePermission),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error(`Error adding permission ${permission} to role ${roleGuid}:`, error);
    throw error;
  }
};

/**
 * Remove a permission from a role
 * @param permissionGuid The GUID of the role permission to remove
 */
export const removePermissionFromRole = async (permissionGuid: string, token?: string): Promise<void> => {
  try {
    // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
    const authToken = token || getToken();
    
    if (!authToken) {
      throw new Error('Authentication token is required for removing role permissions');
    }
    
    await baseApiService.request(`${ROLE_PERMISSIONS_ENDPOINT}(${permissionGuid})`, {
      method: 'DELETE',
      token: authToken
    });
  } catch (error) {
    console.error(`Error removing permission ${permissionGuid}:`, error);
    throw error;
  }
};

/**
 * Replace one permission with another
 * @param removePermissionGuid The GUID of the permission to remove
 * @param roleGuid The GUID of the role
 * @param newPermission The new permission string to add
 */
export const replacePermission = async (
  removePermissionGuid: string,
  roleGuid: string,
  newPermission: string,
  token?: string
): Promise<RolePermission> => {
  try {
    // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
    const authToken = token || getToken();
    
    if (!authToken) {
      throw new Error('Authentication token is required for replacing role permissions');
    }
    
    // First remove the existing permission
    await removePermissionFromRole(removePermissionGuid, authToken);
    
    // Then add the new permission
    return await addPermissionToRole(roleGuid, newPermission, authToken);
  } catch (error) {
    console.error(`Error replacing permission for role ${roleGuid}:`, error);
    throw error;
  }
};

/**
 * Get detailed information about a role
 * @param roleGuid The GUID of the role
 */
export const getRole = async (roleGuid: string, token?: string): Promise<Role> => {
  try {
    // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
    const authToken = token || getToken();
    
    if (!authToken) {
      throw new Error('Authentication token is required for fetching role details');
    }
    
    const response = await baseApiService.request(`${ROLES_ENDPOINT}(${roleGuid})`, {
      method: 'GET',
      token: authToken
    });
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching role ${roleGuid}:`, error);
    throw error;
  }
};
