import React from 'react';
import { Route, RouteComponentProps, RouteProps } from 'react-router-dom';
import { RequireAuth } from '../../auth/require-auth';
import { RouteConfig } from '../../app-routes';

interface ProtectedRouteProps extends Omit<RouteProps, 'component'> {
  component: React.ComponentType<RouteComponentProps>;
  requiredRoles?: string[];
  public?: boolean;
}

/**
 * Protected route component that enforces authentication and role requirements
 * If route is public, renders without authentication
 * If route requires authentication, uses RequireAuth to check user state
 * If route requires specific roles, checks role requirements
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  requiredRoles = [],
  public: isPublic = false,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        // Public routes are accessible without authentication
        if (isPublic) {
          return <Component {...props} />;
        }
        
        // Protected routes require authentication and possibly specific roles
        return (
          <RequireAuth requiredRoles={requiredRoles}>
            <Component {...props} />
          </RequireAuth>
        );
      }}
    />
  );
};

/**
 * Creates a protected route from a route config object
 * @param routeConfig Route configuration object
 * @returns Protected route component
 */
export const createProtectedRoute = (routeConfig: RouteConfig) => {
  const { path, component, requiredRoles, public: isPublic } = routeConfig;
  
  return (
    <ProtectedRoute
      key={path}
      exact
      path={path}
      component={component}
      requiredRoles={requiredRoles}
      public={isPublic}
    />
  );
};
