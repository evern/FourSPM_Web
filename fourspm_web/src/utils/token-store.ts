/**
 * Simplified Token Store for Optimized Direct Access Pattern
 * Provides basic token storage and retrieval from localStorage
 */

// Storage key for token in localStorage
export const TOKEN_STORAGE_KEY = 'fourspm_auth_token';

/**
 * Get the current token value from localStorage
 * @returns Current token or null if not set
 */
export const getToken = (): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  } catch (error) {
    console.error('TokenStore: Error accessing localStorage', error);
    return null;
  }
};

/**
 * Set the token value in localStorage
 * @param token - Token value to store, or null to clear
 */
export const setToken = (token: string | null): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token === null) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } else {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    }
  } catch (error) {
    console.error('TokenStore: Error setting token in localStorage', error);
  }
};
