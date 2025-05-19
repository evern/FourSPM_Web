import React, { ReactElement } from 'react';
import { Route, Redirect, RouteComponentProps } from 'react-router-dom';
import { useMSALAuth } from '../../contexts/msal-auth';
import LoadPanel from 'devextreme-react/load-panel';

export interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<RouteComponentProps>;
  exact?: boolean;
}

export const ProtectedRoute = ({
  component: Component,
  ...rest
}: ProtectedRouteProps): ReactElement => {
  const { user, loading } = useMSALAuth();
  
  if (loading) {
    return (
      <LoadPanel
        shadingColor="rgba(0,0,0,0.1)"
        visible={true}
        showIndicator={true}
        shading={true}
        message="Verifying authentication..."
      />
    );
  }
  
  return (
    <Route
      {...rest}
      render={(props) => {
        // Check if user is authenticated
        const isAuthenticated = !!user;
        
        if (!isAuthenticated) {
          // User is not authenticated, redirect to login
          return (
            <Redirect
              to={{
                pathname: '/login',
                state: { from: props.location }
              }}
            />
          );
        }
        
        // User is authenticated, render the component
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
