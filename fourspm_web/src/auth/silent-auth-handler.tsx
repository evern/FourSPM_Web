import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useMsal, MsalAuthenticationResult } from '@azure/msal-react';
import { InteractionStatus, InteractionType, InteractionRequiredAuthError } from '@azure/msal-browser';
import LoadPanel from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { loginRequest } from './msalConfig';
import { useAuth } from './auth-context';
import { tokenService } from './token-service';

interface SilentAuthHandlerProps {
  children: React.ReactNode;
}

/**
 * Component that handles silent authentication for returning users
 * It attempts to sign in users silently when they return to the app
 * Uses MSAL's inProgress status to avoid infinite loops
 */
export const SilentAuthHandler: React.FC<SilentAuthHandlerProps> = ({ children }) => {
  const { instance, inProgress, accounts } = useMsal();
  const { user } = useAuth();
  const [silentAuthAttempted, setSilentAuthAttempted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const history = useHistory();
  
  useEffect(() => {
    const attemptSilentSignIn = async () => {
      // Only attempt silent sign-in if:
      // 1. We haven't already tried
      // 2. No user is logged in yet
      // 3. There's an account in MSAL cache
      // 4. Authentication is not currently in progress
      if (
        !silentAuthAttempted && 
        !user && 
        accounts.length > 0 && 
        inProgress === InteractionStatus.None
      ) {
        try {
          setIsLoading(true);
          console.log('Attempting silent authentication...');
          
          // Mark that we've attempted silent auth so we don't try again
          setSilentAuthAttempted(true);
          
          // Attempt to acquire token silently
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
          });
          
          console.log('Silent authentication successful');
          
          // Store token in token service
          // The auth context will pick up the account change and update the user
          tokenService.setTokenInfo(response);
          
          // Silent auth succeeded, redirect to home or last known route if available
          const redirectPath = sessionStorage.getItem('lastPath') || '/';
          
          // Clear any login-related URL parameters
          if (window.location.hash.includes('#/login')) {
            history.push(redirectPath);
          }
          
          notify({
            message: 'Welcome back!',
            type: 'success',
            displayTime: 2000,
            position: { at: 'top center', my: 'top center' }
          });
        } catch (error) {
          console.log('Silent authentication failed:', error);
          // Don't show errors for silent auth - just let the user login normally
          // Only log interaction-required errors, as these are expected in many cases
          if (!(error instanceof InteractionRequiredAuthError)) {
            console.error('Unexpected error during silent auth:', error);
          }
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    attemptSilentSignIn();
  }, [silentAuthAttempted, user, accounts, inProgress, instance, history]);
  
  // Save the current path whenever it changes (except for login paths)
  useEffect(() => {
    const currentPath = history.location.pathname;
    if (currentPath !== '/login' && !currentPath.includes('/login')) {
      sessionStorage.setItem('lastPath', currentPath);
    }
  }, [history.location.pathname]);
  
  // Show loading indicator while attempting silent auth
  if (isLoading) {
    return <LoadPanel visible={true} shadingColor="rgba(0, 0, 0, 0.1)" />
  }
  
  return <>{children}</>;
};
