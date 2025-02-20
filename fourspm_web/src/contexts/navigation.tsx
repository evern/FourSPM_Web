import React, { useState, createContext, useContext, useEffect, ReactElement, PropsWithChildren } from 'react';
import { RouteComponentProps } from 'react-router-dom';

interface NavigationData {
  currentPath?: string;
}

interface NavigationContextType {
  navigationData: NavigationData;
  setNavigationData: React.Dispatch<React.SetStateAction<NavigationData>>;
}

const NavigationContext = createContext<NavigationContextType>({
  navigationData: {},
  setNavigationData: () => {}
});

const useNavigation = (): NavigationContextType => useContext(NavigationContext);

function NavigationProvider({ children }: PropsWithChildren<{}>): ReactElement {
  const [navigationData, setNavigationData] = useState<NavigationData>({});

  return (
    <NavigationContext.Provider
      value={{ navigationData, setNavigationData }}
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
