import { sharedApiService } from './api/shared-api.service';

/**
 * Interface for Area entity
 */
export interface Area {
  guid: string;
  projectGuid: string;
  number: string;
  description: string;
}

/**
 * Gets all areas
 * @param token User authentication token
 * @param projectId Optional project GUID to filter areas
 * @returns Array of areas
 */
export const getAreas = async (token: string, projectId?: string): Promise<Area[]> => {
  try {
    const query = projectId ? `$filter=projectGuid eq ${projectId}` : '';
    return await sharedApiService.getAll<Area>('/odata/v1/Areas', token, query);
  } catch (error) {
    console.error('Error fetching areas:', error);
    throw error;
  }
};

/**
 * Gets area details by GUID
 * @param areaId Area GUID
 * @param token User authentication token
 * @returns Area details
 */
export const getAreaDetails = async (areaId: string, token: string): Promise<Area> => {
  try {
    return await sharedApiService.getById<Area>('/odata/v1/Areas', areaId, token);
  } catch (error) {
    console.error('Error fetching area details:', error);
    throw error;
  }
};

/**
 * Gets all areas for a specific project
 * @param projectId Project GUID
 * @param token User authentication token
 * @returns Array of areas for the specified project
 */
export const getProjectAreas = async (projectId: string, token: string): Promise<Area[]> => {
  if (!projectId) {
    throw new Error('No project ID provided');
  }
  
  try {
    return await getAreas(token, projectId);
  } catch (error) {
    console.error(`Error fetching areas for project ${projectId}:`, error);
    throw error;
  }
};
