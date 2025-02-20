import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import appInfo from './app-info';
import routes from './app-routes';
import { SideNavOuterToolbar as SideNavBarLayout } from './layouts';
import { Footer } from './components';

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
        <Redirect to={'/home'} />
      </Switch>
      <Footer>
        Copyright © 2011-{new Date().getFullYear()} {appInfo.title} Inc.
        <br />
        All trademarks or registered trademarks are property of their
        respective owners.
      </Footer>
    </SideNavBarLayout>
  );
}

export default Content;
