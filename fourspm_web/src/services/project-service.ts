import { API_CONFIG } from '../config/api';
import { NavigationItem } from '../app-navigation';
import { projectStatuses } from '../pages/projects/project-statuses';

interface Project {
  guid: string;
  projectNumber: string;
  name: string;
  projectStatus: string;
}

export interface ClientDetails {
  guid: string;
  number: string;
  description: string;
  clientContact: string | null;
}

export interface ProjectDetails {
  guid: string;
  clientGuid: string | null;
  projectNumber: string;
  name: string | null;
  purchaseOrderNumber: string | null;
  projectStatus: string;
  progressStart: string | null;
  created: string;
  createdBy: string;
  updated: string | null;
  updatedBy: string | null;
  deleted: string | null;
  deletedBy: string | null;
  client?: ClientDetails | null;
}

export const getProjectNavigation = async (token: string): Promise<NavigationItem[]> => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch projects');
    
    const data = await response.json();
    const projects: Project[] = data.value;

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

export const getProjectDetails = async (projectId: string, token: string): Promise<ProjectDetails> => {
  console.log('Bearer Token:', token); 
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects(${projectId})?$expand=Client`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch project details');
    
    const data = await response.json();
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
      } : null
    };
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};

export async function updateProject(projectId: string, data: Partial<ProjectDetails>, token: string): Promise<ProjectDetails> {
  const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects(${projectId})`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update project');
  }

  // If status is 204 No Content, return the data we sent as it was successfully updated
  if (response.status === 204) {
    return { ...data } as ProjectDetails;
  }

  // Otherwise try to parse the response as JSON
  try {
    return await response.json();
  } catch (error) {
    console.error('Error parsing response:', error);
    // If we can't parse the response but the status was OK, return the data we sent
    return { ...data } as ProjectDetails;
  }
}
