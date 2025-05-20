// Shared token cache for authentication
// This cache is used by both the auth interceptor and token acquisition logic
// to avoid duplicate token refresh operations and maintain a single source of truth

export interface TokenCache {
  token: string | null;
  expiresAt: number;
  isRefreshing: boolean;
  refreshPromise: Promise<string | null> | null;
}

// Minimum token lifetime in seconds before considering it expired
export const TOKEN_REFRESH_THRESHOLD = 300; // 5 minutes

// The shared token cache instance
export const tokenCache: TokenCache = {
  token: null,
  expiresAt: 0,
  isRefreshing: false,
  refreshPromise: null,
};

/**
 * Checks if the current token is expired or about to expire
 * @returns boolean - True if the token is expired or will expire soon
 */
export const isTokenExpired = (): boolean => {
  return !tokenCache.token || Date.now() >= tokenCache.expiresAt - (TOKEN_REFRESH_THRESHOLD * 1000);
};

/**
 * Resets the token cache to its initial state
 */
export const resetTokenCache = (): void => {
  tokenCache.token = null;
  tokenCache.expiresAt = 0;
  tokenCache.isRefreshing = false;
  tokenCache.refreshPromise = null;
};
