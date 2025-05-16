import React from 'react';
import { Switch, Redirect } from 'react-router-dom';
import appInfo from './app-info';
import routes from './app-routes';
import { SideNavOuterToolbar as SideNavBarLayout } from './layouts';
import { Footer } from './components';
import ScrollToTop from './components/scroll-to-top';
import { createProtectedRoute } from './components/protected-route/protected-route';

const Content: React.FC = () => {
  return (
    <SideNavBarLayout title={appInfo.title}>
      <Switch>
        {routes.map(routeConfig => createProtectedRoute(routeConfig))}
        <Redirect to={"/home"} />
      </Switch>
      <Footer>
        Copyright 2024-{new Date().getFullYear()} {appInfo.title} Pty Ltd.
      </Footer>
      <ScrollToTop showAfterScrollHeight={120} />
    </SideNavBarLayout>
  );
}

export default Content;
