import { NavigationItem } from '../app-navigation';
import { Project, projectStatuses, ProjectNavigationItem } from '../types/index';
import { apiService } from '../api/api.service';
import { PROJECTS_ENDPOINT } from '../config/api-endpoints';

/**
 * Project data adapter - provides methods for fetching and manipulating project data
 */

/**
 * Fetch project information from the API
 * @param projectId The project GUID to fetch information for
 * @param token The user's authentication token
 * @param expandClient Whether to expand client data (default: true)
 * @returns A promise resolving to the project information
 */
export const fetchProject = async (projectId: string, token: string, expandClient: boolean = true): Promise<Project> => {
  try {
    // Fetch project with expanded client information if requested
    const expand = expandClient ? 'Client' : undefined;
    const project = await apiService.getById<Project>(PROJECTS_ENDPOINT, projectId, token, expand);
    
    // Only transform date fields if needed
    if (project.progressStart) {
      project.progressStart = new Date(project.progressStart);
    }
    
    return project;
  } catch (error) {
    console.error('fetchProject: Error in getById call', error);
    throw error;
  }
};

/**
 * Gets project navigation items for the application menu
 * @param token Authentication token
 * @returns Array of navigation items for projects
 */
export const getProjectNavigation = async (token: string): Promise<NavigationItem[]> => {
  try {
    // Validate token
    if (!token) {
      throw new Error('Authentication token is required for API requests');
    }
    
    const response = await apiService.getAll<ProjectNavigationItem>(PROJECTS_ENDPOINT, token);
    const projects: ProjectNavigationItem[] = response.value || [];
    
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
              text: 'Variations',
              path: `/projects/${project.guid}/variations`,
              icon: 'detailslayout',
              id: `variations_${project.guid}`
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
 * Updates a project's details
 * @param projectId Project GUID
 * @param data Partial project data to update
 * @param token Authentication token
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
    const result = await apiService.update<Partial<Project>>(
      PROJECTS_ENDPOINT,
      projectId,
      apiData,
      token,  // Pass token to apiService
      false   // Do not return representation
    );
    
    // Fetch updated project details
    return fetchProject(projectId, token);
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};
