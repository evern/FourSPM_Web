import { AccountInfo, AuthenticationResult, InteractionRequiredAuthError, PublicClientApplication } from '@azure/msal-browser';
import { loginRequest, msalConfig } from '../config/auth/msalConfig';

// Create MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

/**
 * Auth service for handling Microsoft Authentication Library (MSAL) operations
 * Follows the same pattern as other service modules in the application
 */
export const authService = {
  /**
   * Initialize the MSAL instance
   */
  initialize: () => {
    // Attempt to SSO if accounts exist in cache
    msalInstance.handleRedirectPromise().catch(error => {
      console.error('Error during MSAL redirect handling:', error);
    });
  },

  /**
   * Get all accounts from MSAL cache
   */
  getAllAccounts: (): AccountInfo[] => {
    return msalInstance.getAllAccounts();
  },

  /**
   * Get active account from MSAL cache
   */
  getActiveAccount: (): AccountInfo | null => {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  },

  /**
   * Set active account in MSAL instance
   */
  setActiveAccount: (account: AccountInfo): void => {
    msalInstance.setActiveAccount(account);
  },

  /**
   * Login with redirect
   */
  loginRedirect: async (): Promise<void> => {
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Error during login redirect:', error);
    }
  },

  /**
   * Acquire token silently, fall back to redirect if interaction required
   */
  acquireToken: async (): Promise<AuthenticationResult | null> => {
    const account = msalInstance.getActiveAccount();
    if (!account) {
      console.error('No active account found');
      return null;
    }

    try {
      return await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account
      });
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        try {
          // Fallback to redirect if silent token acquisition fails
          await msalInstance.acquireTokenRedirect(loginRequest);
          return null; // Will redirect, so won't actually return
        } catch (redirectError) {
          console.error('Error during token redirect:', redirectError);
          return null;
        }
      }
      console.error('Error during token acquisition:', error);
      return null;
    }
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      await msalInstance.logoutRedirect();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
};

export default authService;
