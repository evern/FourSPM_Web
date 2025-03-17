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
    text: 'Client List',
    path: '/clients',
    icon: 'user',
    id: 'client_maintenance'
  },
  {
    text: 'Project List',
    path: '/projects',
    icon: 'activefolder',
    id: 'project_list'
  },
];

// Initialize the navigation with static items first
export const navigation: NavigationItem[] = [
  ...getStaticNavigation(),
  // Add Configurations as the last item
  {
    text: 'Configurations',
    icon: 'preferences',
    path: '',
    items: [
      {
        text: 'Disciplines',
        path: '/disciplines',
        icon: 'tags'
      },
      {
        text: 'Document Types',
        path: '/document-types',
        icon: 'docxfile'
      },
      {
        text: 'Deliverable Gate',
        path: '/deliverable-gates',
        icon: 'check'
      },
    ],
  },
];
