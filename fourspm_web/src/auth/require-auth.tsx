import React, { useEffect } from 'react';
import { Redirect, useLocation, useHistory } from 'react-router-dom';
import { useAuth } from './auth-context';
import LoadPanel from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';

interface RequireAuthProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

/**
 * Component that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 * Optionally checks for required roles
 */
export function RequireAuth({ children, requiredRoles = [] }: RequireAuthProps) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();
  
  // Show loading panel while auth state is being determined
  if (loading) {
    return <LoadPanel visible={true} />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // Check required roles if specified
  const history = useHistory();
  
  useEffect(() => {
    if (requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => hasRole(role));
      
      if (!hasRequiredRole) {
        // Show a toast notification instead of redirecting to a dedicated page
        notify({
          message: 'You do not have permission to access this page',
          type: 'error',
          displayTime: 5000,
          position: { at: 'top center', my: 'top center' }
        });
        
        // Navigate back to the previous page or to home if there's no history
        setTimeout(() => {
          history.length > 1 ? history.goBack() : history.push('/home');
        }, 300);
      }
    }
  }, [requiredRoles, hasRole, history]);
  
  // If roles are required but not met, show loading temporarily until navigation happens
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return <LoadPanel visible={true} />;
  }
  
  // User is authenticated and has required roles
  return <>{children}</>;
}

/**
 * Higher-order component version of RequireAuth
 * Use this to wrap entire route components
 */
export function withRequireAuth(Component: React.ComponentType, requiredRoles: string[] = []) {
  return function WithRequireAuth(props: any) {
    return (
      <RequireAuth requiredRoles={requiredRoles}>
        <Component {...props} />
      </RequireAuth>
    );
  };
}
