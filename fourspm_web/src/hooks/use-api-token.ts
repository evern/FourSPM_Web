import { useCallback } from 'react';
import { useToken } from '../contexts/token-context';

/**
 * Hook to provide a standardized way to get tokens for API requests
 * 
 * This hook simplifies token management when making API calls by:
 * 1. Checking for a valid token
 * 2. Refreshing tokens if they're expiring soon
 * 3. Returning tokens in the format needed by apiService
 * 
 * Following the FourSPM UI Development Guidelines:
 * - Uses Context+Reducer pattern for state management
 * - Follows separation of concerns
 * - Properly memoizes functions
 * - Provides consistent interface across feature contexts
 * 
 * @returns Object with withToken function for wrapping API calls
 */
export const useApiToken = () => {
  const { token, acquireToken, isTokenExpiringSoon } = useToken();
  
  /**
   * Execute an API function with a valid token
   * @param apiFn Function that accepts a token and returns a Promise
   * @returns Promise with the API function result
   */
  const withToken = useCallback(async <T>(apiFn: (token: string) => Promise<T>): Promise<T> => {
    // If token is expiring soon (within 5 minutes), refresh it first
    if (isTokenExpiringSoon(300)) {
      console.log('useApiToken: Token expiring soon, refreshing before API call');
      await acquireToken(true);
    }
    
    // Get the current token
    if (!token) {
      console.log('useApiToken: No token available, acquiring before API call');
      await acquireToken();
      
      // If still no token after attempt to acquire, throw error
      if (!token) {
        throw new Error('Failed to acquire authentication token for API request');
      }
    }
    
    // Execute the API function with the token
    return apiFn(token);
  }, [token, acquireToken, isTokenExpiringSoon]);
  
  return { withToken };
};
