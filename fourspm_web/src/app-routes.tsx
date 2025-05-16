import { ComponentType } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { withNavigationWatcher } from './contexts/navigation';
import { 
  // Main pages
  HomePage, 
  ProfilePage,
  
  // Collection pages
  ProjectsPage as Projects,
  DeliverablesPage as Deliverables,
  AreasPage as Areas,
  ClientsPage as Clients,
  DisciplinesPage as Disciplines,
  DocumentTypesPage as DocumentTypes,
  DeliverableGatesPage as DeliverableGates,
  VariationsPage as Variations,
  RoleManagementPage as RoleManagement,
  
  // Profile & detail pages
  ProjectProfilePage as ProjectProfile,
  DeliverableProgressPage as DeliverableProgress,
  VariationDeliverablesPage as VariationDeliverables
} from './pages';

// Permission Management
import PermissionManagement from './pages/permission-management/permission-management';

export interface RouteConfig {
  path: string;
  component: ComponentType<RouteComponentProps>;
  /**
   * Optional roles that are required to access this route.
   * If not provided, the route will only require authentication.
   * If provided, user must have at least one of the listed roles.
   */
  requiredRoles?: string[];
  /**
   * If true, this route is accessible without authentication.
   * Default is false (authentication required).
   */
  public?: boolean;
}

/**
 * Define role constants for better maintainability
 */
export const Roles = {
  ADMIN: 'Admin',
  PROJECT_MANAGER: 'ProjectManager',
  TEAM_LEAD: 'TeamLead',
  ENGINEER: 'Engineer',
  VIEWER: 'Viewer'
} as const;

const routes: RouteConfig[] = [
  // Project detail routes - require ProjectManager or TeamLead role
  {
    path: '/projects/:projectId/profile',
    component: ProjectProfile,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD]
  },
  {
    path: '/projects/:projectId/deliverables',
    component: Deliverables,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD, Roles.ENGINEER]
  },
  {
    path: '/projects/:projectId/areas',
    component: Areas,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD, Roles.ENGINEER]
  },
  {
    path: '/projects/:projectId/progress',
    component: DeliverableProgress,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD, Roles.ENGINEER, Roles.VIEWER]
  },
  {
    path: '/projects/:projectId/variations',
    component: Variations,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD]
  },
  {
    path: '/variations/:variationId/deliverables',
    component: VariationDeliverables,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD]
  },
  
  // Main list/collection pages - available to all authenticated users with appropriate roles
  {
    path: '/projects',
    component: Projects,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER, Roles.TEAM_LEAD, Roles.ENGINEER, Roles.VIEWER]
  },
  {
    path: '/clients',
    component: Clients,
    requiredRoles: [Roles.ADMIN, Roles.PROJECT_MANAGER]
  },
  {
    path: '/disciplines',
    component: Disciplines,
    requiredRoles: [Roles.ADMIN]
  },
  {
    path: '/document-types',
    component: DocumentTypes,
    requiredRoles: [Roles.ADMIN]
  },
  {
    path: '/deliverable-gates',
    component: DeliverableGates,
    requiredRoles: [Roles.ADMIN]
  },
  {
    path: '/role-management',
    component: RoleManagement,
    requiredRoles: [Roles.ADMIN]
  },
  {
    path: '/role-management/:roleId/permissions',
    component: PermissionManagement,
    requiredRoles: [Roles.ADMIN]
  },
  
  // Basic pages available to all authenticated users
  {
    path: '/profile',
    component: ProfilePage
    // No roles required - available to all authenticated users
  },
  {
    path: '/home',
    component: HomePage
    // No roles required - available to all authenticated users
  }
];

export default routes.map(route => ({
  ...route,
  component: withNavigationWatcher(route.component)
}));
