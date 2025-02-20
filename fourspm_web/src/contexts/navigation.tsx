import React, { useState, createContext, useContext, useEffect, PropsWithChildren, useCallback } from 'react';
import { RouteComponentProps } from 'react-router-dom';

interface NavigationContextType {
  navigationData: { currentPath?: string };
  setNavigationData: React.Dispatch<React.SetStateAction<{ currentPath?: string }>>;
}

const NavigationContext = createContext<NavigationContextType>({
  navigationData: {},
  setNavigationData: () => {}
});

const useNavigation = () => useContext(NavigationContext);

interface NavigationProviderProps extends PropsWithChildren<{}> {}

function NavigationProvider({ children }: NavigationProviderProps) {
  const [navigationData, setNavigationData] = useState<{ currentPath?: string }>({});

  return (
    <NavigationContext.Provider
      value={{ navigationData, setNavigationData }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

function withNavigationWatcher<P extends RouteComponentProps>(Component: React.ComponentType<P>) {
  const WrappedComponent: React.FC<P> = (props) => {
    const { path } = props.match;
    const { setNavigationData } = useNavigation();

    useEffect(() => {
      setNavigationData({ currentPath: path });
    }, [path, setNavigationData]);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `WithNavigationWatcher(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

export {
  NavigationProvider,
  useNavigation,
  withNavigationWatcher
};
