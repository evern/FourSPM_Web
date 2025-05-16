import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import appInfo from './app-info';
import routes from './app-routes';
import { SideNavOuterToolbar as SideNavBarLayout } from './layouts';
import { Footer } from './components';
import ScrollToTop from './components/scroll-to-top';

const Content: React.FC = () => {
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
        {/* Only redirect to home if we hit a non-matching route */}
        <Route path="*">
          <Redirect to={'/home'} />
        </Route>
      </Switch>
      <Footer>
        Copyright 2024-{new Date().getFullYear()} {appInfo.title} Pty Ltd.
      </Footer>
      <ScrollToTop showAfterScrollHeight={120} />
    </SideNavBarLayout>
  );
}

export default Content;
