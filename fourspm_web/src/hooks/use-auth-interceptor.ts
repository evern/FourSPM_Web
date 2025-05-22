import { useEffect, useRef } from 'react';
import { useMSALAuth } from '../contexts/msal-auth';
import { API_CONFIG } from '../config/api';

/**
 * Configuration object for the auth interceptor
 * Used to enable/disable the interceptor for testing explicit token passing
 */
export const AUTH_INTERCEPTOR_CONFIG = {
  enabled: false, // Set to false to disable the interceptor and test explicit token passing
};

/**
 * Hook that sets up a global fetch interceptor to inject authentication tokens
 * This follows the separation of concerns principle by keeping authentication
 * separate from API service implementation.
 */
export const useAuthInterceptor = () => {
  const { acquireToken } = useMSALAuth();
  const isMounted = useRef(true);
  
  // Track component mount state
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Set up global fetch interceptor when component mounts (if enabled)
  // This effect will re-run if the enabled flag changes, allowing runtime toggling
  useEffect(() => {
    if (!isMounted.current || !AUTH_INTERCEPTOR_CONFIG.enabled) {
      console.log('AuthInterceptor: Interceptor disabled, using explicit token passing only');
      return;
    }
    
    console.log('AuthInterceptor: Setting up fetch interceptor (enabled=' + AUTH_INTERCEPTOR_CONFIG.enabled + ')');
    const originalFetch = window.fetch;
    
    const getToken = async (): Promise<string | null> => {
      // Simply use MSAL's acquireToken directly - it handles caching internally
      try {
        if (!isMounted.current) return null;
        
        const token = await acquireToken();
        return token;
      } catch (error) {
        console.error('AuthInterceptor: Error acquiring token:', error);
        return null;
      }
    };
    
    window.fetch = async (input, init) => {
      // Only intercept API calls to our backend
      const isApiCall = typeof input === 'string' && input.includes(API_CONFIG.baseUrl);
      
      if (!isApiCall) {
        return originalFetch(input, init);
      }
      
      try {
        const token = await getToken();
        
        if (!token) {
          console.warn('AuthInterceptor: No token available for request');
          return originalFetch(input, init);
        }
        
        // Initialize headers if not present
        const headers = new Headers(init?.headers);
        headers.set('Authorization', `Bearer ${token}`);
        
        // Create new init object with updated headers
        const newInit = {
          ...init,
          headers: Object.fromEntries(headers.entries())
        };
        
        // Make the request
        const response = await originalFetch(input, newInit);
        
        // If we get a 401, retry once with a fresh token
        if (response.status === 401) {
          console.log('AuthInterceptor: Received 401, refreshing token and retrying...');
          
          // Force a fresh token from MSAL (it will handle clearing its own cache)
          const newToken = await getToken();
          if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            const retryInit = {
              ...init,
              headers: Object.fromEntries(headers.entries())
            };
            return originalFetch(input, retryInit);
          }
        }
        
        return response;
      } catch (error) {
        console.error('AuthInterceptor: Error in fetch interceptor:', error);
        throw error;
      }
    };
    
    // Cleanup function to restore original fetch when component unmounts or interceptor is disabled
    return () => {
      if (window.fetch !== originalFetch) {
        window.fetch = originalFetch;
        console.log('AuthInterceptor: Restored original fetch');
      }
    };
  }, [acquireToken]);
};
