import { API_CONFIG } from '../config/api';
import { NavigationItem } from '../app-navigation';
import { projectStatuses } from '../pages/projects/project-statuses';

interface Project {
  guid: string;
  projectNumber: string;
  name: string;
  projectStatus: string;
}

export interface ProjectDetails {
  guid: string;
  clientNumber: string;
  projectNumber: string;
  name: string | null;
  clientContact: string | null;
  purchaseOrderNumber: string | null;
  projectStatus: string;
  created: string;
  createdBy: string;
  updated: string | null;
  updatedBy: string | null;
  deleted: string | null;
  deletedBy: string | null;
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
    const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects(${projectId})`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch project details');
    
    const data = await response.json();
    return {
      guid: data.guid,
      clientNumber: data.clientNumber,
      projectNumber: data.projectNumber,
      name: data.name,
      clientContact: data.clientContact,
      purchaseOrderNumber: data.purchaseOrderNumber,
      projectStatus: data.projectStatus,
      created: data.created,
      createdBy: data.createdBy,
      updated: data.updated,
      updatedBy: data.updatedBy,
      deleted: data.deleted,
      deletedBy: data.deletedBy
    };
  } catch (error) {
    console.error('Error fetching project details:', error);
    throw error;
  }
};
