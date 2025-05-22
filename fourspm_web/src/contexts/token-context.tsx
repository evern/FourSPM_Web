import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, PropsWithChildren } from 'react';
import { useMSALAuth } from './msal-auth';

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
 * TokenContext type definition
 */
interface TokenContextType {
  token: string | null;
  loading: boolean;
  error: string | null;
  acquireToken: (forceRefresh?: boolean) => Promise<string | null>;
  getToken: () => Promise<string | null>;
  clearToken: () => void;
  isTokenExpiringSoon: (bufferSeconds?: number) => boolean;
  getTokenRemainingTime: () => number | null;
}

// Create the context with default values
const TokenContext = createContext<TokenContextType>({
  token: null,
  loading: false,
  error: null,
  acquireToken: async () => null,
  getToken: async () => null,
  clearToken: () => {},
  isTokenExpiringSoon: () => false,
  getTokenRemainingTime: () => null
});

/**
 * Token Provider Component
 * 
 * Centralized token management with automatic refresh
 * Following the FourSPM UI Development Guidelines:
 * - Uses Context+Reducer pattern for state management
 * - Keeps provider components close to where they're used
 * - Memoizes context values to prevent unnecessary re-renders
 * 
 * @param children Child components that will have access to the token context
 * @param bufferSeconds Seconds before token expiration to refresh (default: 300)
 * @returns React component that provides token context
 */
export const TokenProvider: React.FC<PropsWithChildren<{
  bufferSeconds?: number;
}>> = ({ children, bufferSeconds = DEFAULT_REFRESH_BUFFER }) => {
  const msalAuth = useMSALAuth();
  const [token, setToken] = useState<string | null>(null);
  const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const lastRefreshAttempt = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  /**
   * Check if token is expiring soon
   * @param bufferSecs Seconds before expiration to consider "soon"
   * @returns Boolean indicating if token will expire soon
   */
  const isTokenExpiringSoon = useCallback((bufferSecs: number = bufferSeconds): boolean => {
    if (!tokenExpiration || !token) {
      return false;
    }
    
    // Check if token will expire within buffer period
    const bufferMs = bufferSecs * 1000;
    return Date.now() + bufferMs > tokenExpiration;
  }, [token, tokenExpiration, bufferSeconds]);
  
  /**
   * Get remaining time until token expiration
   * @returns Seconds until expiration, or null if no token or expiration
   */
  const getTokenRemainingTime = useCallback((): number | null => {
    if (!tokenExpiration || !token) {
      return null;
    }
    
    const remainingMs = tokenExpiration - Date.now();
    return remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0;
  }, [token, tokenExpiration]);
  
  /**
   * Acquire a token and update state
   * @param forceRefresh Force a token refresh even if current token is valid
   * @returns Promise resolving to acquired token or null
   */
  const acquireToken = useCallback(async (forceRefresh: boolean = false): Promise<string | null> => {
    try {
      if (!isMounted.current) return null;
      
      // Check if we already have a valid token
      if (token && !forceRefresh && !isTokenExpiringSoon()) {
        return token;
      }
      
      if (isMounted.current) {
        setLoading(true);
        setError(null);
      }
      
      // Acquire new token from MSAL
      const newToken = await msalAuth.acquireToken();
      
      if (newToken && isMounted.current) {
        // Default token expiration to 1 hour (3600 seconds) if not provided
        // This is a reasonable default for MSAL tokens
        const expiresIn = 3600;
        const newExpiration = Date.now() + expiresIn * 1000;
        
        // Update state
        setToken(newToken);
        setTokenExpiration(newExpiration);
        
        console.log(`TokenContext: Token acquired, expires in ${expiresIn} seconds`);
        
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
  }, [token, msalAuth, isTokenExpiringSoon]);
  
  /**
   * Get the current token or acquire a new one if none exists
   * @returns Promise resolving to current/new token or null
   */
  const getToken = useCallback(async (): Promise<string | null> => {
    // If we have a valid token, use it
    if (token && !isTokenExpiringSoon()) return token;
    
    // Otherwise acquire a new token
    return acquireToken();
  }, [token, acquireToken, isTokenExpiringSoon]);
  
  /**
   * Clear the current token
   */
  const clearToken = useCallback(() => {
    setToken(null);
    setTokenExpiration(null);
  }, []);
  
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
    
    // Check if token is expiring soon
    if (isTokenExpiringSoon()) {
      try {
        console.log(`TokenContext: Token will expire soon. Refreshing...`);
        isRefreshing.current = true;
        lastRefreshAttempt.current = now;
        
        // Force refresh to get a new token
        await acquireToken(true);
        
        const remainingTime = getTokenRemainingTime();
        console.log(`TokenContext: Successfully refreshed token. New expiration in ${remainingTime}s`);
      } catch (error) {
        console.error('TokenContext: Failed to refresh token:', error);
      } finally {
        isRefreshing.current = false;
      }
    }
  }, [acquireToken, isTokenExpiringSoon, getTokenRemainingTime]);
  
  // Set up automatic token refresh
  useEffect(() => {
    // Run initial token acquisition
    acquireToken();
    
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
  }, [acquireToken, checkAndRefreshToken]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    token,
    loading,
    error,
    acquireToken,
    getToken,
    clearToken,
    isTokenExpiringSoon,
    getTokenRemainingTime
  }), [token, loading, error, acquireToken, getToken, clearToken, isTokenExpiringSoon, getTokenRemainingTime]);
  
  return (
    <TokenContext.Provider value={contextValue}>
      {children}
    </TokenContext.Provider>
  );
};

/**
 * Custom hook to use the token context
 * @returns TokenContextType containing token and related functions
 */
export const useToken = (): TokenContextType => useContext(TokenContext);
