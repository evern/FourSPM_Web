import { useEffect, useCallback, useRef } from 'react';
import { useToken } from '../contexts/token-context';

/**
 * Buffer time in seconds before token expiration when we should refresh
 * Default is 5 minutes (300 seconds)
 */
const DEFAULT_REFRESH_BUFFER = 300;

/**
 * Minimum interval in milliseconds between refresh checks
 * Default is 30 seconds
 */
const CHECK_INTERVAL = 30 * 1000;

/**
 * Hook for automatic token refresh
 * 
 * This hook will automatically refresh tokens before they expire.
 * Place this hook high in your component tree (e.g. in App component or a layout wrapper)
 * to ensure tokens stay valid across your application.
 * 
 * Following the FourSPM UI Development Guidelines:
 * - Uses proper dependencies in hooks
 * - Follows separation of concerns principles
 * - Integrates with the centralized token management system
 * 
 * @param bufferSeconds Number of seconds before expiration to refresh token (default: 300s/5min)
 * @returns Object containing refresh state information
 */
export const useTokenRefresh = (bufferSeconds: number = DEFAULT_REFRESH_BUFFER) => {
  const { acquireToken } = useToken();
  const lastRefreshAttempt = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);
  
  /**
   * Check if token needs refreshing and refresh it if necessary
   */
  const checkAndRefreshToken = useCallback(async () => {
    // Avoid multiple concurrent refresh attempts
    if (isRefreshing.current) {
      return;
    }
    
    // Check if enough time has passed since last attempt (prevent rapid firing)
    const now = Date.now();
    if (now - lastRefreshAttempt.current < CHECK_INTERVAL) {
      return;
    }
    
    // Periodic refresh based on interval rather than expiration
    try {
      // We'll periodically refresh the token without checking expiration
      // This approach relies on MSAL for actual token management
      console.log('Token refresh: Performing periodic token refresh');
      isRefreshing.current = true;
      lastRefreshAttempt.current = now;
      
      // Force refresh to get a new token
      await acquireToken(true);
      
      console.log('Token refresh: Successfully refreshed token');
    } catch (error) {
      console.error('Token refresh: Failed to refresh token:', error);
    } finally {
      isRefreshing.current = false;
    }
  }, [acquireToken, bufferSeconds]);
  
  // Set up periodic token refresh check
  useEffect(() => {
    // Run initial check
    checkAndRefreshToken();
    
    // Set up interval for periodic checks
    const intervalId = setInterval(checkAndRefreshToken, CHECK_INTERVAL);
    
    // Set up event listeners for user activity
    const handleUserActivity = () => {
      checkAndRefreshToken();
    };
    
    // Check when user becomes active again
    window.addEventListener('focus', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [checkAndRefreshToken]);
  
  // Provide manual refresh function
  const refreshToken = useCallback(async () => {
    try {
      isRefreshing.current = true;
      lastRefreshAttempt.current = Date.now();
      await acquireToken(true);
      return true;
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, [acquireToken]);
  
  return {
    refreshToken,
    isRefreshing: isRefreshing.current
  };
};
