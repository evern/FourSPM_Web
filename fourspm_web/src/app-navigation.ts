export interface NavigationItem {
  text: string;
  path?: string;
  icon?: string;
  items?: NavigationItem[];
  expanded?: boolean;
  id?: string;
}

export const getStaticNavigation = (): NavigationItem[] => [
  {
    text: 'Home',
    path: '/home',
    icon: 'home',
    id: 'home'
  },
  {
    text: 'Project List',
    path: '/projects',
    icon: 'activefolder',
    id: 'project_list'
  },
  {
    text: 'Client List',
    path: '/clients',
    icon: 'user',
    id: 'client_maintenance'
  }
];

export const navigation: NavigationItem[] = getStaticNavigation();
