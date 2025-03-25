import { NavigationItem } from '../app-navigation';
import { Project, projectStatuses, ProjectNavigationItem } from '../types/index';
import { sharedApiService } from '../api/shared-api.service';
import { API_CONFIG } from '../config/api';

/**
 * Project data adapter - provides methods for fetching and manipulating project data
 */

/**
 * Fetch project information from the API
 * @param projectId The project GUID to fetch information for
 * @param userToken The user's authentication token
 * @returns A promise resolving to the project information
 */
export const fetchProject = async (projectId: string, userToken: string): Promise<Project> => {
  try {
    const data = await sharedApiService.getById<any>('/odata/v1/Projects', projectId, userToken, '$expand=Client');
    
    // Format project information to maintain ProjectInfo interface for backward compatibility
    const projectInfo = {
      guid: data.guid,
      projectNumber: data.projectNumber || '',
      name: data.name || '',
      progressStart: data.progressStart ? new Date(data.progressStart) : new Date(),
      projectStatus: data.projectStatus,
      // Include all Project fields needed by the full Project interface
      created: data.created,
      createdBy: data.createdBy,
      updated: data.updated,
      updatedBy: data.updatedBy,
      deleted: data.deleted,
      deletedBy: data.deletedBy,
      clientGuid: data.clientGuid,
      client: data.client,
      purchaseOrderNumber: data.purchaseOrderNumber
    };
    
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
export const getProjectDetails = async (projectId: string, token: string): Promise<Project> => {
  try {
    const data = await sharedApiService.getById<any>('/odata/v1/Projects', projectId, token, '$expand=Client');
    
    // Map API response to Project interface
    return {
      guid: data.guid,
      projectNumber: data.projectNumber || '',
      name: data.name || '',
      purchaseOrderNumber: data.purchaseOrderNumber || '',
      projectStatus: data.projectStatus || '',
      progressStart: data.progressStart || null,
      client: data.client || null,
      clientGuid: data.clientGuid || null,
      created: data.created || new Date().toISOString(),
      createdBy: data.createdBy || '',
      updated: data.updated || null,
      updatedBy: data.updatedBy || null,
      deleted: data.deleted || null,
      deletedBy: data.deletedBy || null
    };
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
  data: Partial<Project>, 
  token: string
): Promise<Project> => {
  try {
    // Format data for API
    const apiData = {
      ...data,
      // Remove client object if present, as we only want to send the clientGuid
      client: undefined
    };
    
    // Perform update
    const result = await sharedApiService.update<Partial<Project>>(
      '/odata/v1/Projects',
      projectId,
      apiData,
      token
    );
    
    // Fetch updated project details
    return getProjectDetails(projectId, token);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};
