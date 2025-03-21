import { ProjectInfo } from '../types/project';
import { sharedApiService } from './api/shared-api.service';

/**
 * Fetch project information from the API
 * @param projectId The project GUID to fetch information for
 * @param userToken The user's authentication token
 * @returns A promise resolving to the project information
 */
export const fetchProject = async (projectId: string, userToken: string): Promise<ProjectInfo> => {
  console.log('fetchProject: Calling sharedApiService.getById', { projectId });
  try {
    const data = await sharedApiService.getById<any>('/odata/v1/Projects', projectId, userToken);
    console.log('fetchProject: Raw API response', data);
    
    // Format project information
    const projectInfo = {
      guid: data.guid,
      projectNumber: data.projectNumber || '',
      name: data.name || '',
      progressStart: data.progressStart ? new Date(data.progressStart) : new Date(),
      projectStatus: data.projectStatus
    };
    
    console.log('fetchProject: Formatted project info', projectInfo);
    return projectInfo;
  } catch (error) {
    console.error('fetchProject: Error in getById call', error);
    throw error;
  }
};
