import { useCallback, useState, useEffect, useRef } from 'react';
import { useMSALAuth } from '../contexts/msal-auth';
import { setToken as setGlobalToken, getToken as getGlobalToken, isTokenExpiringSoon } from '../utils/token-store';

/**
 * Hook for standardized token acquisition across feature contexts
 * 
 * Following the FourSPM UI Development Guidelines:
 * - Uses useCallback for all functions
 * - Properly tracks loading/error states
 * - Provides consistent interface across feature contexts
 * 
 * @returns Object containing token state and acquisition functions
 */
export const useTokenAcquisition = () => {
  const msalAuth = useMSALAuth();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Check if we should refresh the token
   * @returns Boolean indicating if token should be refreshed
   */
  const shouldRefreshToken = useCallback((): boolean => {
    // Check if the token is expiring soon (within 5 minutes)
    return isTokenExpiringSoon(300); // 5 minutes in seconds
  }, []);

  /**
   * Acquire a token and update state
   * @param forceRefresh Force a token refresh even if current token is valid
   * @returns Promise resolving to acquired token or null
   */
  const acquireToken = useCallback(async (forceRefresh: boolean = false): Promise<string | null> => {
    try {
      if (!isMounted.current) return null;
      
      // Check if we already have a valid token in the global store
      const existingToken = getGlobalToken();
      if (existingToken && !forceRefresh && !shouldRefreshToken()) {
        if (isMounted.current) {
          setToken(existingToken);
        }
        return existingToken;
      }
      
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }
      
      const newToken = await msalAuth.acquireToken();
      
      if (newToken && isMounted.current) {
        // Default token expiration to 1 hour (3600 seconds) if not provided
        // This is a reasonable default for MSAL tokens
        const expiresIn = 3600;
        
        // Update local state
        setToken(newToken);
        
        // Update global token store with expiration
        setGlobalToken(newToken, expiresIn);
        
        return newToken;
      }
      
      if (isMounted.current) {
        setError('Failed to acquire token');
      }
      return null;
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error acquiring token';
      if (isMounted.current) {
        setError(errorMessage);
      }
      console.error('Token acquisition error:', err);
      return null;
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [msalAuth]);

  /**
   * Get the current token or acquire a new one if none exists
   * @returns Promise resolving to current/new token or null
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    // First check the global token store for a valid token
    const globalToken = getGlobalToken();
    if (globalToken) {
      // Update local state with the global token
      if (isMounted.current) {
        setToken(globalToken);
      }
      return globalToken;
    }

    // If we have a token in local state, use it
    if (token) return token;

    // Otherwise acquire a new token
    return acquireToken();
  }, [token, acquireToken]);

  /**
   * Clear the current token
   */
  const clearToken = useCallback(() => {
    // Clear both local state and global store
    setToken(null);
    setGlobalToken(null);
  }, []);
  
  // Acquire token on mount
  useEffect(() => {
    acquireToken();
  }, [acquireToken]);

  /**
   * Create a callback function compatible with apiService token callback
   * @returns Function that returns a promise resolving to a token
   */
  const createTokenCallback = useCallback(() => {
    return async () => {
      return getToken();
    };
  }, [getToken]);

  return {
    token,
    loading,
    error,
    acquireToken,
    getToken,
    clearToken,
    createTokenCallback
  };
};
