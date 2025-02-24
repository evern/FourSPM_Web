import { ComponentType } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { withNavigationWatcher } from './contexts/navigation';
import { HomePage, TasksPage, ProfilePage, ProjectsPage } from './pages';
import Deliverables from './pages/deliverables/deliverables';

interface RouteConfig {
  path: string;
  component: ComponentType<RouteComponentProps>;
}

const routes: RouteConfig[] = [
  {
    path: '/projects/:projectId/deliverables',
    component: Deliverables
  },
  {
    path: '/projects/:id',
    component: ProjectsPage
  },
  {
    path: '/projects',
    component: ProjectsPage
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
