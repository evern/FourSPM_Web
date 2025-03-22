import { ComponentType } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { withNavigationWatcher } from './contexts/navigation';
import { HomePage, ProfilePage, ProjectsPage } from './pages';
import Deliverables from './pages/deliverables/deliverables';
import Areas from './pages/areas/areas';
import ProjectProfile from './pages/project/project-profile';
import Progress from './pages/progress/progress';
import Clients from './pages/clients/clients';
import Disciplines from './pages/disciplines/disciplines';
import DocumentTypes from './pages/document-types/document-types';
import DeliverableGates from './pages/deliverable-gates/deliverable-gates';

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
    component: Progress
  },
  {
    path: '/projects',
    component: ProjectsPage
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
