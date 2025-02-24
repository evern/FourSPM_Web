import React, { useState, createContext, useContext, useEffect, ReactElement, PropsWithChildren } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { NavigationItem, getStaticNavigation } from '../app-navigation';
import { getProjectNavigation } from '../services/project-service';
import { useAuth } from './auth';

interface NavigationData {
  currentPath?: string;
}

interface NavigationContextType {
  navigationData: NavigationData;
  setNavigationData: React.Dispatch<React.SetStateAction<NavigationData>>;
  navigation: NavigationItem[];
  refreshNavigation: () => Promise<void>;
}

const NavigationContext = createContext<NavigationContextType>({
  navigationData: {},
  setNavigationData: () => {},
  navigation: getStaticNavigation(),
  refreshNavigation: async () => {}
});

const useNavigation = (): NavigationContextType => useContext(NavigationContext);

function NavigationProvider({ children }: PropsWithChildren<{}>): ReactElement {
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const [navigation, setNavigation] = useState<NavigationItem[]>(getStaticNavigation());
  const { user } = useAuth();

  const refreshNavigation = async () => {
    try {
      if (!user?.token) return;

      const staticNav = getStaticNavigation();
      const projectNav = await getProjectNavigation(user.token);
      
      // Create project status navigation structure
      const projectStatusNav: NavigationItem = {
        text: 'Project Status',
        icon: 'activefolder',
        expanded: true,
        items: projectNav.map(project => {
          const basePath = project.items?.[0]?.path?.replace('/deliverables', '') || project.path;
          return {
            text: project.text,
            icon: project.icon,
            path: basePath,
            id: `status_${basePath}`, // Add unique id for each item
            items: project.items?.map(item => ({
              ...item,
              id: `status_${item.path}` // Add unique id for sub-items
            }))
          };
        })
      };

      // Insert project status nav after "Project List"
      const mergedNav = [...staticNav];
      const projectListIndex = mergedNav.findIndex(item => item.path === '/projects');
      if (projectListIndex !== -1 && projectNav.length > 0) {
        mergedNav.splice(projectListIndex + 1, 0, projectStatusNav);
      }
      
      setNavigation(mergedNav);
    } catch (error) {
      console.error('Error refreshing navigation:', error);
    }
  };

  useEffect(() => {
    refreshNavigation();
  }, [user?.token]); // Refresh when auth token changes

  return (
    <NavigationContext.Provider
      value={{ navigationData, setNavigationData, navigation, refreshNavigation }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

function withNavigationWatcher<P extends RouteComponentProps>(Component: React.ComponentType<P>) {
  return function WithNavigationWatcher(props: P): ReactElement {
    const { path } = props.match;
    const { setNavigationData } = useNavigation();

    useEffect(() => {
      setNavigationData({ currentPath: path });
    }, [path, setNavigationData]);

    return React.createElement(Component, props);
  }
}

export {
  NavigationProvider,
  useNavigation,
  withNavigationWatcher
}

export type { NavigationData, NavigationContextType };
