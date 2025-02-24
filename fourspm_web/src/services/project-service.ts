import { API_CONFIG } from '../config/api';
import { NavigationItem } from '../app-navigation';
import { projectStatuses } from '../pages/projects/project-statuses';

interface Project {
  guid: string;
  projectNumber: string;
  name: string;
  projectStatus: string;
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
          path: `/projects/${project.guid}`,
          items: [
            {
              text: 'Deliverables',
              path: `/projects/${project.guid}/deliverables`,
              icon: 'doc'
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
