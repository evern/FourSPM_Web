import { ComponentType } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { withNavigationWatcher } from './contexts/navigation';
import { HomePage, TasksPage, ProfilePage } from './pages';

interface RouteConfig {
  path: string;
  component: ComponentType<RouteComponentProps>;
}

const routes: RouteConfig[] = [
  {
    path: '/tasks',
    component: TasksPage
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
