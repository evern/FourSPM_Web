import { NavigationItem } from '../app-navigation';
import { ProjectInfo, projectStatuses, ProjectNavigationItem, ClientDetails, ProjectDetails } from '../types/project';
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

/**
 * Gets project navigation items for the application menu
 * @param token User authentication token
 * @returns Array of navigation items for projects
 */
export const getProjectNavigation = async (token: string): Promise<NavigationItem[]> => {
  try {
    const projects: ProjectNavigationItem[] = await sharedApiService.getAll<ProjectNavigationItem>(
      '/odata/v1/Projects',
      token
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
 * Gets client details by GUID
 * @param clientId Client GUID
 * @param token User authentication token
 * @returns Client details including contact information
 */
export const getClientDetails = async (clientId: string, token: string): Promise<any> => {
  try {
    const data = await sharedApiService.getById<any>('/odata/v1/Clients', clientId, token);
    
    return {
      ...data,
      clientContactName: data.clientContactName || null,
      clientContactNumber: data.clientContactNumber || null,
      clientContactEmail: data.clientContactEmail || null
    };
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
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
    // Use the expand query parameter to include client information
    const data = await sharedApiService.getById<any>(
      '/odata/v1/Projects',
      projectId,
      token,
      '$expand=Client'
    );
    
    return {
      guid: data.guid,
      clientGuid: data.clientGuid,
      projectNumber: data.projectNumber,
      name: data.name,
      purchaseOrderNumber: data.purchaseOrderNumber,
      projectStatus: data.projectStatus,
      progressStart: data.progressStart,
      created: data.created,
      createdBy: data.createdBy,
      updated: data.updated,
      updatedBy: data.updatedBy,
      deleted: data.deleted,
      deletedBy: data.deletedBy,
      client: data.client ? {
        guid: data.client.guid,
        number: data.client.number,
        description: data.client.description,
        clientContact: data.client.clientContact
      } : null,
      clientContactName: data.clientContactName,
      clientContactNumber: data.clientContactNumber,
      clientContactEmail: data.clientContactEmail
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
export async function updateProject(projectId: string, data: Partial<ProjectDetails>, token: string): Promise<ProjectDetails> {
  try {
    await sharedApiService.update<ProjectDetails>(
      '/odata/v1/Projects',
      projectId,
      data,
      token
    );
    
    // Return the data we sent as it was successfully updated
    return { ...data } as ProjectDetails;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}
