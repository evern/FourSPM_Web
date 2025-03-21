import { API_CONFIG } from '../config/api';
import { ProjectInfo } from '../types/project';

/**
 * Fetch project information from the API
 * @param projectId The project GUID to fetch information for
 * @param userToken The user's authentication token
 * @returns A promise resolving to the project information
 */
export const fetchProject = async (projectId: string, userToken: string): Promise<ProjectInfo> => {
  if (!userToken || !projectId) {
    throw new Error('Missing token or project ID');
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects(${projectId})`, {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch project info: ${await response.text()}`);
  }
  
  const data = await response.json();
  
  // Format project information
  return {
    projectNumber: data.projectNumber || '',
    name: data.name || '',
    progressStart: data.progressStart ? new Date(data.progressStart) : new Date()
  };
};
