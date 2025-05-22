import React, { useState, createContext, useContext, useCallback, PropsWithChildren, ReactElement, useEffect, useMemo, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useMSALAuth } from './msal-auth';
import { useToken } from '../contexts/token-context';
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
  isLoading: boolean; // Indicate when navigation is being loaded
}

const NavigationContext = createContext<NavigationContextType>({
  navigationData: {},
  setNavigationData: () => {},
  navigation: appNavigation,
  refreshNavigation: async () => {},
  isLoading: false
});

const useNavigation = (): NavigationContextType => useContext(NavigationContext);

function NavigationProvider({ children }: PropsWithChildren<{}>): ReactElement {
  const [navigationData, setNavigationData] = useState<NavigationData>({});
  const [navigation, setNavigation] = useState<NavigationItem[]>(appNavigation);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const msalAuth = useMSALAuth();
  
  // Use the centralized token acquisition hook
  const { token, acquireToken } = useToken();
  
  // Refresh navigation when authenticated
  const refreshNavigation = useCallback(async () => {
    try {
      // Only proceed if user is authenticated
      if (!msalAuth.user) {
        console.log('NavigationProvider: Waiting for authentication');
        return;
      }
      
      // Add small delay to ensure token provider is registered with API service
      // This follows our pattern for handling auth token race conditions mentioned in memory [ae8865c1]
      
      setIsLoading(true);
      
      // Small delay to ensure token provider is fully registered with the API service
      // This prevents 401 errors that can occur when navigation refresh happens too quickly after auth
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('NavigationProvider: Refreshing navigation after token sync delay');
      
      // Ensure we have a token before proceeding
      let currentToken = token;
      if (!currentToken) {
        console.log('NavigationProvider: Acquiring token for navigation');
        currentToken = await acquireToken();
        if (!currentToken) {
          console.warn('NavigationProvider: Failed to acquire token for navigation');
          setIsLoading(false);
          return;
        }
      }
      
      const staticNav = getStaticNavigation();
      const projectNav = await getProjectNavigation(currentToken);
      
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
      
      // Reset loading state after successful navigation update
      setIsLoading(false);
    } catch (error) {
      console.error('NavigationProvider: Error refreshing navigation:', error);
      setIsLoading(false);
    }
  }, [msalAuth.user, token, acquireToken]);

  useEffect(() => {
    refreshNavigation();
  }, [msalAuth.user, refreshNavigation]); // Refresh when auth state or function reference changes

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    navigationData,
    setNavigationData,
    navigation,
    refreshNavigation,
    isLoading
  }), [navigationData, navigation, refreshNavigation, isLoading]);

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
