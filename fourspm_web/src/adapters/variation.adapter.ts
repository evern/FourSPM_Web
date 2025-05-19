import { sharedApiService } from '../api/shared-api.service';
import { createProjectFilter } from '../utils/odata-filters';
import { VARIATIONS_ENDPOINT } from '../config/api-endpoints';
import { Variation } from '../types/odata-types';

/**
 * Gets all variations for a specific project
 * @param projectId Project GUID
 * @returns Array of variations for the specified project
 */
export const getProjectVariations = async (projectId: string): Promise<Variation[]> => {
  try {
    let query = '';
    if (projectId) {
      query = createProjectFilter(projectId);
    }
    
    return await sharedApiService.getAll<Variation>(VARIATIONS_ENDPOINT, query);
  } catch (error) {
    console.error('Error fetching variations:', error);
    throw error;
  }
};

/**
 * Creates a new variation
 * @param variation The variation data to create
 * @returns The created variation
 */
export const createVariation = async (variation: Variation): Promise<Variation> => {
  try {
    return await sharedApiService.post<Variation>(VARIATIONS_ENDPOINT, variation);
  } catch (error) {
    console.error('Error creating variation:', error);
    throw error;
  }
};

/**
 * Updates an existing variation
 * @param variation The variation data to update
 * @returns The updated variation
 */
export const updateVariation = async (variation: Variation): Promise<void> => {
  try {
    await sharedApiService.update<Variation>(VARIATIONS_ENDPOINT, variation.guid, variation);
  } catch (error) {
    console.error('Error updating variation:', error);
    throw error;
  }
};

/**
 * Deletes a variation
 * @param variationId The GUID of the variation to delete
 * @returns True if deletion was successful
 */
export const deleteVariation = async (variationId: string): Promise<boolean> => {
  try {
    await sharedApiService.delete(VARIATIONS_ENDPOINT, variationId);
    return true;
  } catch (error) {
    console.error('Error deleting variation:', error);
    throw error;
  }
};

/**
 * Gets a single variation by ID
 * @param variationId Variation GUID
 * @returns The variation with the specified ID
 */
export const getVariationById = async (variationId: string): Promise<Variation> => {
  try {
    return await sharedApiService.getById<Variation>(VARIATIONS_ENDPOINT, variationId);
  } catch (error) {
    console.error(`Error fetching variation ${variationId}:`, error);
    throw error;
  }
};

/**
 * Approves a variation
 * @param variationGuid The GUID of the variation to approve
 * @returns The updated variation with approval information
 */
export const approveVariation = async (variationGuid: string): Promise<Variation> => {
  try {
    // Use the post method to call our custom action endpoint
    const response = await sharedApiService.post<Variation>(`${VARIATIONS_ENDPOINT}/ApproveVariation/${variationGuid}`, {});
    return response;
  } catch (error) {
    console.error('Error approving variation:', error);
    throw error;
  }
};

/**
 * Rejects a previously approved variation
 * @param variationGuid The GUID of the variation to reject
 * @returns The updated variation with approval information cleared
 */
export const rejectVariation = async (variationGuid: string): Promise<Variation> => {
  try {
    // Use the post method to call our custom action endpoint
    const response = await sharedApiService.post<Variation>(`${VARIATIONS_ENDPOINT}/RejectVariation/${variationGuid}`, {});
    return response;
  } catch (error) {
    console.error('Error rejecting variation:', error);
    throw error;
  }
};
