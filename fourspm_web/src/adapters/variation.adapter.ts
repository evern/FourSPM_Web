import { apiService } from '../api/api.service';
import { createProjectFilter } from '../utils/odata-filters';
import { VARIATIONS_ENDPOINT } from '../config/api-endpoints';
import { Variation } from '../types/odata-types';
import { getToken } from '../utils/token-store';



/**
 * Gets a single variation by ID
 * @param variationId Variation GUID
 * @param token Optional token override - using Optimized Direct Access Pattern by default
 * @returns The variation with the specified ID
 */
export const getVariationById = async (variationId: string, token?: string): Promise<Variation> => {
  // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
  const authToken = token || getToken();
  
  if (!authToken) {
    throw new Error('Authentication token is required for API requests');
  }
  try {
    return await apiService.getById<Variation>(VARIATIONS_ENDPOINT, variationId, authToken);
  } catch (error) {
    console.error(`Error fetching variation ${variationId}:`, error);
    throw error;
  }
};

/**
 * Approves a variation
 * @param variationGuid The GUID of the variation to approve
 * @param token Optional token override - using Optimized Direct Access Pattern by default
 * @returns The updated variation with approval information
 */
export const approveVariation = async (variationGuid: string, token?: string): Promise<Variation> => {
  // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
  const authToken = token || getToken();
  
  if (!authToken) {
    throw new Error('Authentication token is required for API requests');
  }
  try {
    // Use the post method to call our custom action endpoint
    const response = await apiService.post<Variation>(`${VARIATIONS_ENDPOINT}/ApproveVariation/${variationGuid}`, {}, authToken);
    return response;
  } catch (error) {
    console.error('Error approving variation:', error);
    throw error;
  }
};

/**
 * Rejects a previously approved variation
 * @param variationGuid The GUID of the variation to reject
 * @param token Optional token override - using Optimized Direct Access Pattern by default
 * @returns The updated variation with approval information cleared
 */
export const rejectVariation = async (variationGuid: string, token?: string): Promise<Variation> => {
  // Use provided token or get directly from token-store (Optimized Direct Access Pattern)
  const authToken = token || getToken();
  
  if (!authToken) {
    throw new Error('Authentication token is required for API requests');
  }
  try {
    // Use the post method to call our custom action endpoint
    const response = await apiService.post<Variation>(`${VARIATIONS_ENDPOINT}/RejectVariation/${variationGuid}`, {}, authToken);
    return response;
  } catch (error) {
    console.error('Error rejecting variation:', error);
    throw error;
  }
};
