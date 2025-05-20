import { useCallback, useState, useEffect, useRef } from 'react';
import { useMSALAuth } from '../contexts/msal-auth';

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
   * Acquire a token and update state
   * @returns Promise resolving to acquired token or null
   */
  const acquireToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!isMounted.current) return null;
      
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }
      
      const newToken = await msalAuth.acquireToken();
      
      if (newToken && isMounted.current) {
        setToken(newToken);
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
    if (token) return token;
    return acquireToken();
  }, [token, acquireToken]);

  /**
   * Clear the current token
   */
  const clearToken = useCallback(() => {
    setToken(null);
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
