/**
 * Simplified Token Store
 * Provides basic token retrieval from localStorage
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
 * @param token New token value or null to clear
 */
export const setToken = (token: string | null): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('TokenStore: Error setting token in localStorage', error);
  }
};
