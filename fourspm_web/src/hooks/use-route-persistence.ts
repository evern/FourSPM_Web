/**
 * Hook to persist and restore route paths during page refreshes
 * Helps prevent unintended redirects to home after authentication
 */
import { useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useMSALAuth } from '../contexts/msal-auth';

// Key for storing the last route path in sessionStorage
const LAST_ROUTE_KEY = 'fourspm_last_route';

/**
 * Hook that provides route persistence across page refreshes
 * Uses sessionStorage to save and restore route information
 */
export const useRoutePersistence = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, loading } = useMSALAuth();

  // Save current route on changes (if authenticated and not on login/home)
  useEffect(() => {
    if (user && 
        !loading && 
        location.pathname !== '/login' && 
        location.pathname !== '/home' && 
        location.pathname !== '/') {
      // Store the current path for later restoration
      sessionStorage.setItem(LAST_ROUTE_KEY, location.pathname + location.search);
      console.log(`Route persistence: Saved route ${location.pathname}`);
    }
  }, [location.pathname, location.search, user, loading]);
  
  // Restore route on refresh/authentication
  useEffect(() => {
    // Only try to restore if authenticated and coming from login (not direct navigation to home)
    // We can detect this by checking if we've just logged in or reloaded after a login
    const comingFromLogin = sessionStorage.getItem('fourspm_login_redirect') === 'true';
    
    if (user && !loading && comingFromLogin) {
      try {
        // Get the saved route (with a small delay to avoid race conditions)
        setTimeout(() => {
          const savedRoute = sessionStorage.getItem(LAST_ROUTE_KEY);
          if (savedRoute) {
            console.log(`Route persistence: Restoring route to ${savedRoute}`);
            history.replace(savedRoute);
            // Clear the login redirect flag
            sessionStorage.removeItem('fourspm_login_redirect');
          }
        }, 100); // Small delay following established pattern
      } catch (error) {
        console.error('Route persistence: Error restoring route', error);
      }
    }
  }, [user, loading, history]);
  
  // Clear saved route (used when explicitly navigating to home)
  const clearSavedRoute = useCallback(() => {
    sessionStorage.removeItem(LAST_ROUTE_KEY);
    console.log('Route persistence: Cleared saved route');
  }, []);
  
  return { clearSavedRoute };
};
