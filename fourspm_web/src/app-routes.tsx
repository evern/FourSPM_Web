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
  RolesPage as Roles,
  
  // Profile & detail pages
  ProjectProfilePage as ProjectProfile,
  DeliverableProgressPage as DeliverableProgress,
  VariationDeliverablesPage as VariationDeliverables,
  RolePermissionsPage as RolePermissions
} from './pages';

interface RouteConfig {
  path: string;
  component: ComponentType<RouteComponentProps>;
}

const routes: RouteConfig[] = [
  {
    path: '/projects/:projectId/profile',
    component: ProjectProfile
  },
  {
    path: '/projects/:projectId/deliverables',
    component: Deliverables
  },
  {
    path: '/projects/:projectId/areas',
    component: Areas
  },
  {
    path: '/projects/:projectId/progress',
    component: DeliverableProgress
  },
  {
    path: '/projects/:projectId/variations',
    component: Variations
  },
  {
    path: '/variations/:variationId/deliverables',
    component: VariationDeliverables
  },
  {
    path: '/projects',
    component: Projects
  },
  {
    path: '/clients',
    component: Clients
  },
  {
    path: '/disciplines',
    component: Disciplines
  },
  {
    path: '/document-types',
    component: DocumentTypes
  },
  {
    path: '/deliverable-gates',
    component: DeliverableGates
  },
  {
    path: '/roles',
    component: Roles
  },
  {
    path: '/roles/:roleId/permissions',
    component: RolePermissions
  },
  {
    path: '/profile',
    component: ProfilePage
  },
  {
    path: '/home',
    component: HomePage
  }
];

export default routes.map(route => ({
  ...route,
  component: withNavigationWatcher(route.component)
}));
