import React, { useState, createContext, useContext, useCallback, PropsWithChildren, ReactElement, useEffect, useMemo, useRef } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useMSALAuth } from './msal-auth';
import { getToken } from '../utils/token-store';
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
  isLoading: boolean;
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
  

  

  const refreshNavigation = useCallback(async () => {
    try {

      if (!msalAuth.user) {

        return;
      }
      

      
      setIsLoading(true);
      

      await new Promise(resolve => setTimeout(resolve, 100));
      

      

      const currentToken = getToken();
      if (!currentToken) {
        console.warn('NavigationProvider: No token available for navigation');
        setIsLoading(false);
        return;
      }
      
      const staticNav = getStaticNavigation();
      const projectNav = await getProjectNavigation(currentToken);
      

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


      const configurationsItem = appNavigation.find(item => item.text === 'Configurations');


      setNavigation([...staticNav, projectStatusNav, configurationsItem].filter(Boolean) as NavigationItem[]);
      

      setIsLoading(false);
    } catch (error) {
      console.error('NavigationProvider: Error refreshing navigation:', error);
      setIsLoading(false);
    }
  }, [msalAuth.user]);

  useEffect(() => {
    refreshNavigation();
  }, [msalAuth.user, refreshNavigation]);


  const contextValue = useMemo(() => ({
    navigationData,
    setNavigationData,
    navigation,
    refreshNavigation,
    isLoading
  }), [navigationData, navigation, refreshNavigation, isLoading]);


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
    

    
    useEffect(() => {

      if (isMountedRef.current) {
        setNavigationData({ currentPath: path });
      }
      
      return () => {

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
