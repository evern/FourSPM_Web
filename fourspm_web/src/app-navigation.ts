export interface NavigationItem {
  text: string;
  path?: string;
  icon?: string;
  items?: NavigationItem[];
  expanded?: boolean;
}

export const navigation: NavigationItem[] = [
  {
    text: 'Home',
    path: '/home',
    icon: 'home'
  },
  {
    text: 'Project',
    icon: 'activefolder',
    items: [
      {
        text: 'Project List',
        path: '/projects'
      }
    ]
  },
  {
    text: 'Examples',
    icon: 'folder',
    items: [
      {
        text: 'Profile',
        path: '/profile'
      },
      {
        text: 'Tasks',
        path: '/tasks'
      }
    ]
  }
];
