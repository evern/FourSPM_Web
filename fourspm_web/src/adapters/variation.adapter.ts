import { apiService } from '../api/api.service';
import { createProjectFilter } from '../utils/odata-filters';
import { VARIATIONS_ENDPOINT } from '../config/api-endpoints';
import { Variation } from '../types/odata-types';



/**
 * Gets a single variation by ID
 * @param variationId Variation GUID
 * @param token Authentication token
 * @returns The variation with the specified ID
 */
export const getVariationById = async (variationId: string, token: string): Promise<Variation> => {
  try {
    return await apiService.getById<Variation>(VARIATIONS_ENDPOINT, variationId, token);
  } catch (error) {
    console.error(`Error fetching variation ${variationId}:`, error);
    throw error;
  }
};

/**
 * Approves a variation
 * @param variationGuid The GUID of the variation to approve
 * @param token Authentication token
 * @returns The updated variation with approval information
 */
export const approveVariation = async (variationGuid: string, token: string): Promise<Variation> => {
  try {
    // Use the post method to call our custom action endpoint
    const response = await apiService.post<Variation>(`${VARIATIONS_ENDPOINT}/ApproveVariation/${variationGuid}`, {}, token);
    return response;
  } catch (error) {
    console.error('Error approving variation:', error);
    throw error;
  }
};

/**
 * Rejects a previously approved variation
 * @param variationGuid The GUID of the variation to reject
 * @param token Authentication token
 * @returns The updated variation with approval information cleared
 */
export const rejectVariation = async (variationGuid: string, token: string): Promise<Variation> => {
  try {
    // Use the post method to call our custom action endpoint
    const response = await apiService.post<Variation>(`${VARIATIONS_ENDPOINT}/RejectVariation/${variationGuid}`, {}, token);
    return response;
  } catch (error) {
    console.error('Error rejecting variation:', error);
    throw error;
  }
};
