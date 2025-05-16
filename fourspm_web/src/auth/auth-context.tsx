import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, PropsWithChildren } from 'react';
import { useMsal } from '@azure/msal-react';
import { AccountInfo, InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { authReducer, initialAuthState, AuthActionType } from './auth-reducer';
import { AuthContextType, User, ApiResponse } from '../types/auth-types';
import { loginRequest } from './msalConfig';
import { setApiToken } from '../api/base-api.service';
import { tokenService, TokenError, TokenErrorType } from './token-service';
import { mapAuthError, getErrorNotificationConfig, AuthErrorCategory } from './auth-errors';
import notify from 'devextreme/ui/notify';

// Create the Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth-related functions
 */
export function AuthProvider({ children }: PropsWithChildren<{}>) {
  const { instance, accounts, inProgress } = useMsal();
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  
  // Extract the current account if available
  const account = useMemo(() => accounts[0] || null, [accounts]);
  
  /**
   * Event handler for token refresh requests from the token service
   */
  useEffect(() => {
    const handleTokenRefresh = async () => {
      try {
        if (tokenService.shouldRefreshToken() && account) {
          console.log('Proactively refreshing token...');
          dispatch({ type: AuthActionType.SET_LOADING, payload: true });
          
          // Use the token service to refresh the token
          const newToken = await tokenService.refreshToken(instance);
          
          if (newToken && state.user) {
            // Update the user with the new token
            const updatedUser = {
              ...state.user,
              token: newToken,
              tokenExpiresAt: tokenService.getTokenInfo()?.expiresAt
            };
            
            // Update API token store
            setApiToken(newToken);
            
            dispatch({ type: AuthActionType.SET_USER, payload: updatedUser });
            console.log('Token refreshed successfully');
          }
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        
        // Different handling based on error type
        if (error instanceof TokenError) {
          switch (error.type) {
            case TokenErrorType.INTERACTION_REQUIRED:
              // Show a notification that user interaction is required
              notify({
                message: 'Your session requires re-authentication',
                type: 'warning',
                displayTime: 5000,
                position: { at: 'top center', my: 'top center' }
              });
              break;
              
            case TokenErrorType.USER_LOGIN_REQUIRED:
              // User needs to log in again - we'll handle this later when signOut is defined
              dispatch({ type: AuthActionType.SET_ERROR, payload: new Error('Your session has expired. Please sign in again.') });
              
              // Show a notification to the user
              notify({
                message: 'Your session has expired. Please sign in again.',
                type: 'error',
                displayTime: 5000,
                position: { at: 'top center', my: 'top center' }
              });
              break;
              
            case TokenErrorType.NETWORK_ERROR:
              // Just notify about network issues
              notify({
                message: 'Network issue detected. Some features may be unavailable.',
                type: 'warning',
                displayTime: 5000,
                position: { at: 'top center', my: 'top center' }
              });
              break;
              
            default:
              // For other token errors, set the error state
              dispatch({ type: AuthActionType.SET_ERROR, payload: error });
          }
        } else {
          dispatch({ type: AuthActionType.SET_ERROR, payload: error as Error });
        }
      } finally {
        dispatch({ type: AuthActionType.SET_LOADING, payload: false });
      }
    };
    
    // Listen for the custom token refresh event
    window.addEventListener('msalTokenRefreshNeeded', handleTokenRefresh);
    
    // Also check if we need to refresh when the component mounts
    if (tokenService.shouldRefreshToken()) {
      handleTokenRefresh();
    }
    
    return () => {
      window.removeEventListener('msalTokenRefreshNeeded', handleTokenRefresh);
    };
  }, [account, instance, state.user]);

  /**
   * Handle automatic token refresh on an interval
   */
  useEffect(() => {
    // Set up an interval to check if token needs refreshing every minute
    const tokenCheckInterval = setInterval(() => {
      if (tokenService.shouldRefreshToken() && account) {
        console.log('Token refresh time reached, triggering refresh...');
        window.dispatchEvent(new CustomEvent('msalTokenRefreshNeeded'));
      }
    }, 60 * 1000); // Check every minute
    
    return () => {
      clearInterval(tokenCheckInterval);
    };
  }, [account]);
  
  // Update user state based on MSAL account changes
  useEffect(() => {
    const updateUserFromAccount = async () => {
      try {
        // If we have an account and auth is not in progress
        if (account && inProgress === InteractionStatus.None) {
          dispatch({ type: AuthActionType.SET_LOADING, payload: true });
          
          // Acquire token silently
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: account
          });
          
          // Extract user information and roles from token claims
          const idTokenClaims = response.idTokenClaims as Record<string, any>;
          const roles = idTokenClaims?.roles || [];
          
          // Update token service with new token information
          const tokenInfo = tokenService.setTokenInfo(response);
          
          // Create user object
          const user: User = {
            email: account.username,
            displayName: account.name || '',
            token: tokenInfo.accessToken,
            roles: roles,
            account: account,
            tokenExpiresAt: tokenInfo.expiresAt
          };
          
          // Update token store for API requests
          setApiToken(tokenInfo.accessToken);
          
          dispatch({ type: AuthActionType.SET_USER, payload: user });
        } else if (!account && state.user) {
          // If no account but we had a user, reset auth state
          tokenService.clearToken();
          setApiToken(null);
          dispatch({ type: AuthActionType.RESET });
        } else if (!account && inProgress === InteractionStatus.None) {
          // No account and not in progress, just ensure not loading
          dispatch({ type: AuthActionType.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Error getting token:', error);
        if (error instanceof InteractionRequiredAuthError) {
          // Handle interaction required error - will be retried with popup
          dispatch({ type: AuthActionType.SET_ERROR, payload: new Error('Session requires re-authentication') });
        } else if (error instanceof TokenError) {
          dispatch({ type: AuthActionType.SET_ERROR, payload: error });
        } else {
          dispatch({ type: AuthActionType.SET_ERROR, payload: error as Error });
        }
      }
    };
    
    updateUserFromAccount();
  }, [account, instance, inProgress, state.user]);
  
  /**
   * Sign in the user using MSAL popup login with enhanced error handling
   */
  const signIn = useCallback(async (): Promise<ApiResponse<User>> => {
    try {
      dispatch({ type: AuthActionType.SET_LOADING, payload: true });
      
      // Trigger login popup
      const loginResponse = await instance.loginPopup(loginRequest);
      
      // Get the account
      const account = loginResponse.account;
      if (!account) {
        throw new Error('Login successful but no account was returned');
      }
      
      // Acquire token silently now that we're logged in
      const tokenResponse = await instance.acquireTokenSilent({
        ...loginRequest,
        account
      });
      
      // Update token service with new token information
      const tokenInfo = tokenService.setTokenInfo(tokenResponse);
      
      // Extract user information and roles
      const idTokenClaims = tokenResponse.idTokenClaims as Record<string, any>;
      const roles = idTokenClaims?.roles || [];
      
      // Create user object
      const user: User = {
        email: account.username,
        displayName: account.name || '',
        token: tokenInfo.accessToken,
        roles: roles,
        account: account,
        tokenExpiresAt: tokenInfo.expiresAt
      };
      
      // Update API token for requests
      setApiToken(tokenInfo.accessToken);
      
      dispatch({ type: AuthActionType.SET_USER, payload: user });
      
      // Show success notification
      notify({
        message: 'Sign in successful',
        type: 'success',
        displayTime: 2000,
        position: { at: 'top center', my: 'top center' }
      });
      
      return { isOk: true, data: user };
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Map the authentication error to a structured format
      const errorInfo = mapAuthError(error);
      
      // Update the auth state with the error
      dispatch({ 
        type: AuthActionType.SET_ERROR, 
        payload: errorInfo.originalError || new Error(errorInfo.message) 
      });
      
      // Show a user-friendly notification based on the error type
      const notificationConfig = getErrorNotificationConfig(errorInfo);
      notify(notificationConfig);
      
      // Special handling for specific error categories
      if (errorInfo.category === AuthErrorCategory.POPUP_BLOCKED) {
        // Could offer to try a redirect flow instead
        console.log('Popup was blocked, could try redirect flow');
      } else if (errorInfo.category === AuthErrorCategory.NETWORK_ERROR) {
        // Could check connectivity and offer retry
        console.log('Network error detected, connection may be offline');
      }
      
      return { 
        isOk: false, 
        message: errorInfo.message,
        errorDetails: {
          category: errorInfo.category,
          technicalDetails: errorInfo.technicalDetails
        }
      };
    } finally {
      dispatch({ type: AuthActionType.SET_LOADING, payload: false });
    }
  }, [instance]);
  
  /**
   * Sign out the user using MSAL logout
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      const logoutRequest = {
        account: account,
        postLogoutRedirectUri: window.location.origin + '/#/login',
      };
      
      // Reset auth state first to prevent unauthorized access during logout
      dispatch({ type: AuthActionType.RESET });
      
      // Clear API token to prevent unauthorized requests
      setApiToken(null);
      
      // Clear token service state
      tokenService.clearToken();
      
      // Show logout notification
      notify({
        message: 'You have been signed out successfully',
        type: 'success',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
      
      // Logout from MSAL
      await instance.logoutPopup(logoutRequest);
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: AuthActionType.SET_ERROR, payload: error as Error });
      
      // Even if MSAL logout fails, make sure local state is cleared
      setApiToken(null);
      tokenService.clearToken();
    }
  }, [account, instance]);
  
  /**
   * Check if user has a specific role
   */
  const hasRole = useCallback((role: string): boolean => {
    return !!state.user?.roles?.includes(role);
  }, [state.user]);
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user: state.user || undefined,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
    hasRole
  }), [state.user, state.loading, state.error, signIn, signOut, hasRole]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
