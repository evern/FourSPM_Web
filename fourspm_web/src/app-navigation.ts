export interface NavigationItem {
  text: string;
  path?: string;
  icon?: string;
  items?: NavigationItem[];
  expanded?: boolean;
}

export const getStaticNavigation = (): NavigationItem[] => [
  {
    text: 'Home',
    path: '/home',
    icon: 'home'
  },
  {
    text: 'Project List',
    path: '/projects',
    icon: 'activefolder'
  }
];

export const navigation: NavigationItem[] = getStaticNavigation();
