/**
 * Adapter for user permission API endpoints
 * Handles fetching permission data from the backend
 */
import { getToken } from '../utils/token-store';
import { baseApiService } from '../api/base-api.service';
import { CURRENT_USER_PERMISSIONS_ENDPOINT, ROLE_PERMISSIONS_BY_NAME_ENDPOINT } from '../config/api-endpoints';

/**
 * User permission interface from API
 */
export interface UserPermission {
  name: string;
  isViewPermission: boolean;
  isEditPermission: boolean;
}

/**
 * Fetch current user permissions
 * Uses the GetCurrentUserPermissions endpoint
 * @param token Optional token override
 * @returns Array of user permissions
 */
export const fetchCurrentUserPermissions = async (token?: string): Promise<UserPermission[]> => {
  // Use provided token or get directly from token-store
  const authToken = token || getToken();
  
  try {
    // Ensure token is available
    if (!authToken) {
      throw new Error('Authentication token is required for fetching permissions');
    }
    
    // Make the API call to the endpoint
    // Using the defined constant from api-endpoints.ts
    const url = CURRENT_USER_PERMISSIONS_ENDPOINT;
    
    // Use baseApiService with token
    const response = await baseApiService.request(url, {
      method: 'GET',
      token: authToken
    });
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching current user permissions:', error);
    throw error;
  }
};

/**
 * Fetch permissions by role name
 * @param roleName Name of the role
 * @param token Optional token override
 * @returns Array of user permissions
 */
export const fetchPermissionsByRoleName = async (roleName: string, token?: string): Promise<UserPermission[]> => {
  // Use provided token or get directly from token-store
  const authToken = token || getToken();
  
  try {
    // Validate parameters
    if (!roleName) {
      throw new Error('Role name is required');
    }
    
    // Ensure token is available
    if (!authToken) {
      throw new Error('Authentication token is required for fetching role permissions');
    }
    
    // Make the API call to the endpoint
    // Using the defined constant from api-endpoints.ts
    const url = `${ROLE_PERMISSIONS_BY_NAME_ENDPOINT}?roleName=${encodeURIComponent(roleName)}`;
    
    // Use baseApiService with token
    const response = await baseApiService.request(url, {
      method: 'GET',
      token: authToken
    });
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleName}:`, error);
    throw error;
  }
};
