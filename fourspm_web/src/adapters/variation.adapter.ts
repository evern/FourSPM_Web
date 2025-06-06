import { sharedApiService } from '../api/shared-api.service';
import { createProjectFilter } from '../utils/odata-filters';
import { VARIATIONS_ENDPOINT } from '../config/api-endpoints';
import { Variation } from '../types/odata-types';

/**
 * Gets all variations for a specific project
 * @param projectId Project GUID
 * @param token User authentication token
 * @returns Array of variations for the specified project
 */
export const getProjectVariations = async (projectId: string, token: string): Promise<Variation[]> => {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    let query = '';
    if (projectId) {
      query = createProjectFilter(projectId);
    }
    
    return await sharedApiService.getAll<Variation>(VARIATIONS_ENDPOINT, token, query);
  } catch (error) {
    console.error('Error fetching variations:', error);
    throw error;
  }
};

/**
 * Creates a new variation
 * @param variation The variation data to create
 * @param token User authentication token
 * @returns The created variation
 */
export const createVariation = async (variation: Variation, token: string): Promise<Variation> => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    return await sharedApiService.post<Variation>(VARIATIONS_ENDPOINT, token, variation);
  } catch (error) {
    console.error('Error creating variation:', error);
    throw error;
  }
};

/**
 * Updates an existing variation
 * @param variation The variation data to update
 * @param token User authentication token
 * @returns The updated variation
 */
export const updateVariation = async (variation: Variation, token: string): Promise<void> => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    await sharedApiService.update<Variation>(VARIATIONS_ENDPOINT, variation.guid, variation, token);
  } catch (error) {
    console.error('Error updating variation:', error);
    throw error;
  }
};

/**
 * Deletes a variation
 * @param variationId The GUID of the variation to delete
 * @param token User authentication token
 * @returns True if deletion was successful
 */
export const deleteVariation = async (variationId: string, token: string): Promise<boolean> => {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    await sharedApiService.delete(VARIATIONS_ENDPOINT, variationId, token);
    return true;
  } catch (error) {
    console.error('Error deleting variation:', error);
    throw error;
  }
};

/**
 * Gets a single variation by ID
 * @param variationId Variation GUID
 * @param token User authentication token
 * @returns The variation with the specified ID
 */
export const getVariationById = async (variationId: string, token: string): Promise<Variation> => {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    return await sharedApiService.getById<Variation>(VARIATIONS_ENDPOINT, variationId, token);
  } catch (error) {
    console.error(`Error fetching variation ${variationId}:`, error);
    throw error;
  }
};

/**
 * Approves a variation
 * @param variationGuid The GUID of the variation to approve
 * @param token User authentication token
 * @returns The updated variation with approval information
 */
export const approveVariation = async (variationGuid: string, token: string): Promise<Variation> => {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    // Use the post method to call our custom action endpoint
    const response = await sharedApiService.post<Variation>(`${VARIATIONS_ENDPOINT}/ApproveVariation/${variationGuid}`, token, {});
    return response;
  } catch (error) {
    console.error('Error approving variation:', error);
    throw error;
  }
};

/**
 * Rejects a previously approved variation
 * @param variationGuid The GUID of the variation to reject
 * @param token User authentication token
 * @returns The updated variation with approval information cleared
 */
export const rejectVariation = async (variationGuid: string, token: string): Promise<Variation> => {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    // Use the post method to call our custom action endpoint
    const response = await sharedApiService.post<Variation>(`${VARIATIONS_ENDPOINT}/RejectVariation/${variationGuid}`, token, {});
    return response;
  } catch (error) {
    console.error('Error rejecting variation:', error);
    throw error;
  }
};
