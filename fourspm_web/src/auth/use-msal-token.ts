import { useCallback } from 'react';
import { AccountInfo, InteractionRequiredAuthError, SilentRequest } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig';

/**
 * Custom hook for acquiring tokens with built-in silent refresh
 */
export function useMsalToken() {
  const { instance, accounts } = useMsal();
  const account = accounts[0] || null;
  
  /**
   * Acquires a token silently, with fallback to interactive login if necessary
   * @param request Optional override for the default login request
   * @returns The access token or null if acquisition fails
   */
  const acquireToken = useCallback(async (request?: SilentRequest): Promise<string | null> => {
    if (!account) {
      console.error('No active account! Signin required.');
      return null;
    }
    
    const tokenRequest = {
      ...loginRequest,
      account,
      ...(request || {})
    };
    
    try {
      // Try to get token silently
      const response = await instance.acquireTokenSilent(tokenRequest);
      return response.accessToken;
    } catch (error) {
      // If silent acquisition fails, try interactive
      if (error instanceof InteractionRequiredAuthError) {
        try {
          console.log('Silent token acquisition failed, acquiring token using redirect');
          const response = await instance.acquireTokenPopup(tokenRequest);
          return response.accessToken;
        } catch (interactiveError) {
          console.error('Error during interactive token acquisition', interactiveError);
          return null;
        }
      } else {
        console.error('Error during token acquisition:', error);
        return null;
      }
    }
  }, [instance, account]);
  
  /**
   * Gets the current account
   * @returns The current account info or null
   */
  const getCurrentAccount = useCallback((): AccountInfo | null => {
    return account;
  }, [account]);
  
  return { acquireToken, getCurrentAccount };
}
