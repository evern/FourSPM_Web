import { AccountInfo, AuthenticationResult, InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from './msalConfig';
import { mapAuthError, AuthErrorCategory } from './auth-errors';

/**
 * Token expiration buffer in milliseconds (5 minutes)
 * We'll refresh tokens 5 minutes before they actually expire
 */
const TOKEN_EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

/**
 * Maximum number of silent refresh attempts before forcing interactive login
 */
const MAX_SILENT_REFRESH_ATTEMPTS = 3;

/**
 * Retry delay for network issues (starting value, in ms)
 */
const INITIAL_RETRY_DELAY_MS = 1000;

/**
 * Maximum retry delay (in ms)
 */
const MAX_RETRY_DELAY_MS = 30 * 1000;

/**
 * Different types of token errors that can occur
 */
export enum TokenErrorType {
  NETWORK_ERROR = 'network_error',
  INTERACTION_REQUIRED = 'interaction_required',
  USER_LOGIN_REQUIRED = 'user_login_required',
  INTERNAL_ERROR = 'internal_error',
  TOKEN_EXPIRED = 'token_expired',
  REFRESH_FAILED = 'refresh_failed'
}

/**
 * Map from Auth error categories to token error types
 */
const errorCategoryToTokenErrorType = new Map<AuthErrorCategory, TokenErrorType>([
  [AuthErrorCategory.NETWORK_ERROR, TokenErrorType.NETWORK_ERROR],
  [AuthErrorCategory.INTERACTION_REQUIRED, TokenErrorType.INTERACTION_REQUIRED],
  [AuthErrorCategory.TOKEN_EXPIRED, TokenErrorType.TOKEN_EXPIRED],
  [AuthErrorCategory.SERVER_ERROR, TokenErrorType.REFRESH_FAILED]
]);

/**
 * Custom error class for token-related errors
 */
export class TokenError extends Error {
  type: TokenErrorType;
  originalError?: Error;
  errorDetails?: {
    category?: string;
    technicalDetails?: string;
  };
  
  constructor(message: string, type: TokenErrorType, originalError?: Error) {
    super(message);
    this.name = 'TokenError';
    this.type = type;
    this.originalError = originalError;
    
    // If original error exists, map it to get standardized details
    if (originalError) {
      const errorInfo = mapAuthError(originalError);
      this.errorDetails = {
        category: errorInfo.category,
        technicalDetails: errorInfo.technicalDetails
      };
    }
  }
}

/**
 * Token info object with metadata about the token
 */
export interface TokenInfo {
  accessToken: string;
  expiresAt: number;
  refreshAt: number;
  account: AccountInfo;
  scopes: string[];
}

/**
 * Singleton service for managing authentication tokens
 */
export class TokenService {
  private static instance: TokenService;
  private tokenInfo: TokenInfo | null = null;
  private refreshPromise: Promise<string> | null = null;
  private refreshTimeoutId: number | null = null;
  private silentRefreshAttempts = 0;
  
  private constructor() {}
  
  /**
   * Gets the singleton instance of the TokenService
   */
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }
  
  /**
   * Sets the current token information
   */
  public setTokenInfo(authResult: AuthenticationResult): TokenInfo {
    // Get current timestamp in milliseconds
    const now = Date.now();
    
    // Calculate token expiration time
    // MSAL returns expiresOn as a Date object
    const expiresAt = authResult.expiresOn?.getTime() || now + 3600 * 1000; // Default to 1 hour if expiresOn is not available
    
    // Calculate when we should refresh the token (before it expires)
    const refreshAt = expiresAt - TOKEN_EXPIRATION_BUFFER_MS;
    
    this.tokenInfo = {
      accessToken: authResult.accessToken,
      expiresAt,
      refreshAt,
      account: authResult.account,
      scopes: authResult.scopes
    };
    
    // Schedule token refresh
    this.scheduleTokenRefresh();
    
    // Reset the silent refresh attempt counter
    this.silentRefreshAttempts = 0;
    
    return this.tokenInfo;
  }
  
  /**
   * Gets the current access token
   */
  public getAccessToken(): string | null {
    return this.tokenInfo?.accessToken || null;
  }
  
  /**
   * Gets the current token info
   */
  public getTokenInfo(): TokenInfo | null {
    return this.tokenInfo;
  }
  
  /**
   * Clears the current token
   */
  public clearToken(): void {
    this.tokenInfo = null;
    this.cancelScheduledRefresh();
  }
  
  /**
   * Checks if the current token is valid
   */
  public isTokenValid(): boolean {
    if (!this.tokenInfo) return false;
    
    const now = Date.now();
    return now < this.tokenInfo.expiresAt;
  }
  
  /**
   * Checks if the token needs to be refreshed
   */
  public shouldRefreshToken(): boolean {
    if (!this.tokenInfo) return false;
    
    const now = Date.now();
    return now >= this.tokenInfo.refreshAt;
  }
  
  /**
   * Refreshes the token using the MSAL instance
   */
  public async refreshToken(
    msalInstance: any,
    forceInteractive: boolean = false
  ): Promise<string> {
    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    // Create a new refresh promise
    this.refreshPromise = this.performTokenRefresh(msalInstance, forceInteractive);
    
    try {
      // Wait for the refresh to complete
      const token = await this.refreshPromise;
      return token;
    } finally {
      // Clear the promise when done
      this.refreshPromise = null;
    }
  }
  
  /**
   * Actual implementation of token refresh with retry logic
   */
  private async performTokenRefresh(
    msalInstance: any,
    forceInteractive: boolean = false
  ): Promise<string> {
    // If we don't have token info or an account, we can't refresh
    if (!this.tokenInfo?.account) {
      throw new TokenError(
        'No active account found',
        TokenErrorType.USER_LOGIN_REQUIRED
      );
    }
    
    try {
      let tokenResult: AuthenticationResult;
      
      // Try silent refresh first unless interactive is forced
      if (!forceInteractive && this.silentRefreshAttempts < MAX_SILENT_REFRESH_ATTEMPTS) {
        try {
          this.silentRefreshAttempts++;
          
          tokenResult = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: this.tokenInfo.account
          });
        } catch (error) {
          // If interactive auth is required, try that
          if (error instanceof InteractionRequiredAuthError) {
            tokenResult = await msalInstance.acquireTokenPopup(loginRequest);
          } else {
            throw error;
          }
        }
      } else {
        // Force interactive login
        tokenResult = await msalInstance.acquireTokenPopup(loginRequest);
      }
      
      // Update token info with new token
      const tokenInfo = this.setTokenInfo(tokenResult);
      return tokenInfo.accessToken;
    } catch (error) {
      // Handle different error types
      if (error instanceof InteractionRequiredAuthError) {
        throw new TokenError(
          'User interaction required to get a new token',
          TokenErrorType.INTERACTION_REQUIRED,
          error
        );
      } else if (error instanceof TokenError) {
        // Just rethrow TokenErrors
        throw error;
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new TokenError(
          'Network error during token refresh',
          TokenErrorType.NETWORK_ERROR,
          error
        );
      } else {
        // Handle any other errors
        console.error('Token refresh error:', error);
        throw new TokenError(
          'Failed to refresh token',
          TokenErrorType.INTERNAL_ERROR,
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }
  
  /**
   * Schedules a token refresh before the token expires
   */
  private scheduleTokenRefresh(): void {
    // Cancel any existing refresh timeout
    this.cancelScheduledRefresh();
    
    if (!this.tokenInfo) return;
    
    const now = Date.now();
    const timeUntilRefresh = Math.max(0, this.tokenInfo.refreshAt - now);
    
    // Only schedule if the refresh time is in the future
    if (timeUntilRefresh > 0) {
      this.refreshTimeoutId = window.setTimeout(() => {
        // This will be handled by the auth context
        console.log('Token refresh time reached');
        // Dispatch a custom event that the auth context can listen for
        window.dispatchEvent(new CustomEvent('msalTokenRefreshNeeded'));
      }, timeUntilRefresh);
      
      console.log(`Token refresh scheduled in ${timeUntilRefresh / 1000} seconds`);
    }
  }
  
  /**
   * Cancels any scheduled token refresh
   */
  private cancelScheduledRefresh(): void {
    if (this.refreshTimeoutId !== null) {
      window.clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }
  
  /**
   * Implements exponential backoff for retrying operations
   */
  public static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let retries = 0;
    let delay = INITIAL_RETRY_DELAY_MS;
    
    while (true) {
      try {
        return await operation();
      } catch (error) {
        // Don't retry if we've reached max retries
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Don't retry certain error types
        if (error instanceof TokenError) {
          if (
            error.type === TokenErrorType.INTERACTION_REQUIRED || 
            error.type === TokenErrorType.USER_LOGIN_REQUIRED
          ) {
            throw error;
          }
        }
        
        // Wait for the backoff delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase backoff for next attempt (exponential with jitter)
        delay = Math.min(
          delay * 2 * (0.9 + Math.random() * 0.2), // Add 10% jitter
          MAX_RETRY_DELAY_MS
        );
        
        retries++;
      }
    }
  }
}

// Export singleton instance
export const tokenService = TokenService.getInstance();
