import React, { useState, createContext, useContext, useEffect, ReactElement, PropsWithChildren } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { NavigationItem, getStaticNavigation, navigation as appNavigation } from '../app-navigation';
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
  navigation: appNavigation,
  refreshNavigation: async () => {}
});

const useNavigation = (): NavigationContextType => useContext(NavigationContext);

function NavigationProvider({ children }: PropsWithChildren<{}>): ReactElement {
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const [navigation, setNavigation] = useState<NavigationItem[]>(appNavigation);
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
            id: `status_${basePath}`,
            items: project.items?.map(item => ({
              ...item,
              id: `${item.id}_${basePath}`,
              icon: item.icon || 'bulletlist',
              text: `    ${item.text}`
            }))
          };
        })
      };

      // Get the configurations item from appNavigation
      const configurationsItem = appNavigation.find(item => item.text === 'Configurations');

      // Update navigation with project status and configurations at the end
      setNavigation([...staticNav, projectStatusNav, configurationsItem].filter(Boolean) as NavigationItem[]);
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
