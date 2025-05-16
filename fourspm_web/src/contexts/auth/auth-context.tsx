import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { AuthenticationResult } from '@azure/msal-browser';
import { authService } from '../../api/auth.service';
import { authReducer, initialAuthState } from './auth-reducer';
import { AuthActionType, AuthContextType, AuthState } from './auth-types';

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider component following the application's Context+Reducer pattern
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use reducer for state management
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Initialize MSAL when the component mounts
  useEffect(() => {
    // Initialize the MSAL instance
    authService.initialize();

    // Check if the user is already logged in
    const account = authService.getActiveAccount();
    if (account) {
      dispatch({ type: AuthActionType.LOGIN_SUCCESS, payload: account });
      // Acquire token silently if already logged in
      authService.acquireToken().then(response => {
        if (response?.accessToken) {
          dispatch({ type: AuthActionType.SET_TOKEN, payload: response.accessToken });
        }
      });
    }
  }, []);

  // Login function - uses useCallback to prevent unnecessary re-renders
  const login = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: AuthActionType.SET_LOADING, payload: true });
      await authService.loginRedirect();
      // NOTE: After redirect, the component will remount and check authentication in the useEffect above
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to login';
      dispatch({ type: AuthActionType.LOGIN_FAILURE, payload: errorMessage });
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      dispatch({ type: AuthActionType.SET_LOADING, payload: true });
      await authService.logout();
      dispatch({ type: AuthActionType.LOGOUT });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to logout';
      dispatch({ type: AuthActionType.SET_ERROR, payload: errorMessage });
    }
  }, []);

  // Acquire token function
  const acquireToken = useCallback(async (): Promise<AuthenticationResult | null> => {
    try {
      const response = await authService.acquireToken();
      if (response?.accessToken) {
        dispatch({ type: AuthActionType.SET_TOKEN, payload: response.accessToken });
      }
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to acquire token';
      dispatch({ type: AuthActionType.SET_ERROR, payload: errorMessage });
      return null;
    }
  }, []);

  // Get access token function
  const getAccessToken = useCallback((): string | null => {
    return state.accessToken;
  }, [state.accessToken]);

  // Clear error function
  const clearError = useCallback((): void => {
    dispatch({ type: AuthActionType.CLEAR_ERROR });
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      login,
      logout,
      acquireToken,
      getAccessToken,
      clearError
    }),
    [state, login, logout, acquireToken, getAccessToken, clearError]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use the auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Re-export types and hooks for easier imports
 */
export type { AuthState };
export { AuthActionType };
