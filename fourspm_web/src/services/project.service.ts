import { NavigationItem } from '../app-navigation';
import { ProjectInfo, projectStatuses, ProjectNavigationItem, ClientDetails, ProjectDetails } from '../types/project';
import { sharedApiService } from './api/shared-api.service';
import { API_CONFIG } from '../config/api';

/**
 * Fetch project information from the API
 * @param projectId The project GUID to fetch information for
 * @param userToken The user's authentication token
 * @returns A promise resolving to the project information
 */
export const fetchProject = async (projectId: string, userToken: string): Promise<ProjectInfo> => {
  console.log('fetchProject: Calling sharedApiService.getById', { projectId });
  try {
    const data = await sharedApiService.getById<any>('/odata/v1/Projects', projectId, userToken, '$expand=Client');
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

/**
 * Gets project navigation items for the application menu
 * @param token User authentication token
 * @returns Array of navigation items for projects
 */
export const getProjectNavigation = async (token: string): Promise<NavigationItem[]> => {
  try {
    const projects: ProjectNavigationItem[] = await sharedApiService.getAll<ProjectNavigationItem>(
      '/odata/v1/Projects',
      token,
      '$expand=Client'
    );
    
    // Create status-based navigation structure
    const statusNavItems: NavigationItem[] = projectStatuses.map(status => ({
      text: status.name,
      icon: 'folder',
      expanded: true,
      items: projects
        .filter(p => p.projectStatus === status.id)
        .map(project => ({
          text: `${project.projectNumber} - ${project.name}`,
          icon: 'folder',
          id: `project_${project.guid}`,
          items: [
            {
              text: 'Deliverables',
              path: `/projects/${project.guid}/deliverables`,
              icon: 'bulletlist',
              id: `deliverables_${project.guid}`
            },
            {
              text: 'Progress Tracking',
              path: `/projects/${project.guid}/progress`,
              icon: 'chart',
              id: `progress_${project.guid}`
            },
            {
              text: 'Areas',
              path: `/projects/${project.guid}/areas`,
              icon: 'map',
              id: `areas_${project.guid}`
            },
            {
              text: 'Project Details',
              path: `/projects/${project.guid}/profile`,
              icon: 'info',
              id: `details_${project.guid}`
            }
          ]
        }))
    }));

    // Filter out empty status folders
    return statusNavItems.filter(item => item.items && item.items.length > 0);
  } catch (error) {
    console.error('Error fetching project navigation:', error);
    return [];
  }
};

/**
 * Gets detailed project information
 * @param projectId Project GUID
 * @param token User authentication token
 * @returns Project details including client information
 */
export const getProjectDetails = async (projectId: string, token: string): Promise<ProjectDetails> => {
  try {
    console.log(`Getting project details for project ${projectId}`);
    
    // Use standard endpoint with $expand=Client to include related client data
    const result = await sharedApiService.get<ProjectDetails>(
      `/odata/v1/Projects(${projectId})?$expand=Client`,
      token
    );
    
    console.log('Project details response:', result);
    return result;
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

/**
 * Updates project information
 * @param projectId Project GUID
 * @param data Partial project data to update
 * @param token User authentication token
 * @returns Updated project details
 */
export const updateProject = async (
  projectId: string, 
  data: Partial<ProjectDetails>, 
  token: string
): Promise<ProjectDetails> => {
  try {
    // Create a flattened version of the data to avoid complex objects
    const flattenedData: Record<string, any> = {};
    
    // Only include primitive types, not objects like client
    Object.entries(data).forEach(([key, value]) => {
      // Only include primitive values, not objects
      if (
        value === null ||
        typeof value !== 'object' ||
        value instanceof Date
      ) {
        flattenedData[key] = value;
      }
    });
    
    console.log('Sending update with flattened data:', flattenedData);
    
    await sharedApiService.update<ProjectDetails>(
      '/odata/v1/Projects',
      projectId,
      flattenedData,
      token
    );
    
    // Fetch updated project with client data included using custom endpoint
    return await getProjectDetails(projectId, token);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};
