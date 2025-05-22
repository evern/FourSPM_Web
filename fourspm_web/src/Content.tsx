import React, { useEffect } from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import appInfo from './app-info';
import routes from './app-routes';
import { SideNavOuterToolbar as SideNavBarLayout } from './layouts';
import { Footer } from './components';
import ScrollToTop from './components/scroll-to-top';
import { useRoutePersistence } from './hooks/use-route-persistence';

const Content: React.FC = () => {
  // Use the route persistence hook to maintain path during refresh
  const { clearSavedRoute } = useRoutePersistence();
  const location = useLocation();
  
  // Clear saved route when explicitly navigating to home
  // This prevents redirection loop when user actually wants to go home
  useEffect(() => {
    if (location.pathname === '/home' && location.key) {
      // Only clear if this is an actual navigation, not a refresh
      // (refresh doesn't have a location key)
      clearSavedRoute();
    }
  }, [location.pathname, location.key, clearSavedRoute]);
  
  return (
    <SideNavBarLayout title={appInfo.title}>
      <Switch>
        {routes.map(({ path, component: Component }) => (
          <Route
            exact
            key={path}
            path={path}
            component={Component}
          />
        ))}
        <Redirect to={'/home'} />
      </Switch>
      <Footer>
        Copyright 2024-{new Date().getFullYear()} {appInfo.title} Pty Ltd.
      </Footer>
      <ScrollToTop showAfterScrollHeight={120} />
    </SideNavBarLayout>
  );
}

export default Content;
