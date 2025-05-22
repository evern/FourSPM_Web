/**
 * Token store module to share token between components
 * Provides centralized token management with expiration handling
 * This prevents race conditions when handling token expiration and refresh
 */

// Global token storage
let currentToken: string | null = null;

// Token expiration timestamp (milliseconds since epoch)
let tokenExpiration: number | null = null;

/**
 * Set the global token value with optional expiration
 * @param token New token value
 * @param expiresIn Optional seconds until token expires
 */
export const setToken = (token: string | null, expiresIn?: number): void => {
  console.log('TokenStore: Setting global token');
  currentToken = token;
  
  // Set expiration timestamp if provided
  if (token && expiresIn) {
    // Convert seconds to milliseconds and add to current time
    tokenExpiration = Date.now() + expiresIn * 1000;
    console.log(`TokenStore: Token will expire in ${expiresIn} seconds`);
  } else {
    // If no expiration provided or token is null, clear expiration
    tokenExpiration = null;
  }
};

/**
 * Get the current token value, checking for expiration
 * @returns Current valid token or null if not set or expired
 */
export const getToken = (): string | null => {
  // Check if token has expired
  if (tokenExpiration && Date.now() > tokenExpiration) {
    console.log('TokenStore: Token has expired, clearing');
    currentToken = null;
    tokenExpiration = null;
    return null;
  }
  
  return currentToken;
};

/**
 * Check if the current token is about to expire
 * @param bufferSeconds Seconds before actual expiration to consider token as expiring soon
 * @returns True if token will expire within the buffer period
 */
export const isTokenExpiringSoon = (bufferSeconds: number = 60): boolean => {
  if (!tokenExpiration || !currentToken) {
    return false;
  }
  
  // Check if token will expire within buffer period
  const bufferMs = bufferSeconds * 1000;
  return Date.now() + bufferMs > tokenExpiration;
};

/**
 * Get remaining time until token expiration
 * @returns Seconds until expiration, or null if no token or expiration
 */
export const getTokenRemainingTime = (): number | null => {
  if (!tokenExpiration || !currentToken) {
    return null;
  }
  
  const remainingMs = tokenExpiration - Date.now();
  return remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0;
};
