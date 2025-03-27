import { sharedApiService } from '../api/shared-api.service';
import { Area } from '../types/index';
import { createProjectFilter } from '../utils/odata-filters';
import { AREAS_ENDPOINT } from '../config/api-endpoints';

/**
 * Area data adapter - provides methods for fetching and manipulating area data
 */

/**
 * Gets all areas for a specific project
 * @param projectId Project GUID
 * @param token User authentication token
 * @returns Array of areas for the specified project
 */
export const getProjectAreas = async (projectId: string, token: string): Promise<Area[]> => {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    let query = '';
    if (projectId) {
      query = createProjectFilter(projectId);
    }
    
    return await sharedApiService.getAll<Area>(AREAS_ENDPOINT, token, query);
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};
