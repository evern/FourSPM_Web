import React, { useState, createContext, useContext, useCallback, PropsWithChildren, ReactElement, useEffect, useMemo, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useMSALAuth } from './msal-auth';
import { NavigationItem, getStaticNavigation, navigation as appNavigation } from '../app-navigation';
import { getProjectNavigation } from '../adapters/project.adapter';

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
  const msalAuth = useMSALAuth();
  
  // Refresh navigation when authenticated
  const refreshNavigation = useCallback(async () => {
    try {
      // Only proceed if user is authenticated
      if (!msalAuth.user) {
        console.log('NavigationProvider: Waiting for authentication');
        return;
      }
      
      console.log('NavigationProvider: Refreshing navigation');
      const staticNav = getStaticNavigation();
      const projectNav = await getProjectNavigation();
      
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

    }
  }, [msalAuth.user]);

  useEffect(() => {
    refreshNavigation();
  }, [msalAuth.user, refreshNavigation]); // Refresh when auth state or function reference changes

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    navigationData,
    setNavigationData,
    navigation,
    refreshNavigation
  }), [navigationData, navigation, refreshNavigation]);

  // Use the memoized value when providing the context
  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

function withNavigationWatcher<P extends RouteComponentProps>(Component: React.ComponentType<P>) {
  return function WithNavigationWatcher(props: P): ReactElement {
    const { path } = props.match;
    const { setNavigationData } = useNavigation();
    const isMountedRef = useRef(true);
    
    // Log navigation transitions

    
    useEffect(() => {
      // Only update navigation data if component is still mounted
      if (isMountedRef.current) {
        setNavigationData({ currentPath: path });
      }
      
      return () => {
        // Prevent state updates after unmount

        isMountedRef.current = false;
      };
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
