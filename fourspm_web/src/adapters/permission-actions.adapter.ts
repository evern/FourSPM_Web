import { getToken } from '../utils/token-store';
import { apiService } from '../api/api.service';
import { ROLE_PERMISSIONS_ENDPOINT } from '../config/api-endpoints';

/**
 * Set the permission level for a specific feature for a role
 * @param roleId The GUID of the role
 * @param featureKey The feature key identifier
 * @param action The action to perform: 'NoAccess', 'ReadOnly', 'FullAccess', 'Enable', or 'Disable'
 */
/**
 * Sets the permission level for a feature
 * @param roleId The GUID of the role
 * @param featureKey The feature key identifier
 * @param action The action to perform ('NoAccess', 'ReadOnly', 'FullAccess', 'Enable', 'Disable')
 * @param token Optional token override - using Optimized Direct Access Pattern by default
 * @returns A promise that resolves to a success indicator
 */
export const setPermissionLevel = async (
  roleId: string,
  featureKey: string,
  action: string,
  token?: string
): Promise<{ success: boolean }> => {
  try {
    // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
    const authToken = token || getToken();
    
    if (!authToken) {
      throw new Error('Authentication token is required for setting permission levels');
    }
    
    // Create the request payload
    const payload = {
      roleId,
      featureKey,
      action
    };
    
    // Use the post method to call our custom OData function endpoint
    const response = await apiService.post<{ success: boolean }>(
      `${ROLE_PERMISSIONS_ENDPOINT}/SetPermissionLevel`,
      payload,
      authToken
    );
    
    return response;
  } catch (error) {
    console.error(`Error setting permission level for feature ${featureKey}:`, error);
    throw error;
  }
};
