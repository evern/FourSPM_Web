/**
 * Authentication Context Provider
 * Manages authentication state across the application
 * Following the FourSPM UI Development Guidelines using Context+Reducer pattern
 */
import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect, PropsWithChildren } from 'react';
import { PublicClientApplication, EventType, AccountInfo, InteractionRequiredAuthError } from '@azure/msal-browser';

// Import configurations and utilities
import { msalConfig, loginRequest } from '../config/auth/msalConfig';
import { roleService } from '../services/role.service';
import { parseJwtToken, extractClaims, isTokenExpired } from '../api/auth-token.service';
import { Role, RolePermission } from '../adapters/role.adapter';

// Auth State Types
export interface UserInfo {
  id: string;
  displayName: string;
  email: string;
  givenName?: string;
  surname?: string;
  username: string;
  claims?: { type: string; value: string }[];
  token?: string;
}

// Define reducer action types
export enum AuthActionType {
  SET_USER = 'SET_USER',
  SET_ROLES = 'SET_ROLES',
  SET_PERMISSIONS = 'SET_PERMISSIONS',
  SET_LOADING = 'SET_LOADING',
  SIGN_OUT = 'SIGN_OUT',
  AUTH_ERROR = 'AUTH_ERROR',
}

// Auth state interface
export interface AuthState {
  isAuthenticated: boolean;
  user?: UserInfo;
  roles: Role[];
  permissions: string[];
  loading: boolean;
  error?: string;
}

// Action interface for the reducer
export interface AuthAction {
  type: AuthActionType;
  payload?: any;
}

// Context interface
export interface AuthContextProps extends AuthState {
  login: () => Promise<boolean>;
  logout: () => void;
  // Backward compatibility aliases
  signIn: (email?: string, password?: string) => Promise<boolean | { isOk: boolean; data?: UserInfo; message?: string }>;
  signOut: () => void;
  getAccessToken: () => Promise<string | null>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: undefined,
  roles: [],
  permissions: [],
  loading: false,
};

// Create the MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL - must be called before any other MSAL methods
msalInstance.initialize().catch(error => {
  console.error('Failed to initialize MSAL:', error);
});


// Auth reducer function
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActionType.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        error: undefined,
      };
    case AuthActionType.SET_ROLES:
      return {
        ...state,
        roles: action.payload,
      };
    case AuthActionType.SET_PERMISSIONS:
      return {
        ...state,
        permissions: action.payload,
      };
    case AuthActionType.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AuthActionType.SIGN_OUT:
      return {
        ...initialState,
        loading: false,
      };
    case AuthActionType.AUTH_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};

// Create auth context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

/**
 * Authentication Provider Component
 * Provides authentication state and methods to the application
 */
export function AuthProvider({ children }: PropsWithChildren<{}>): React.ReactElement {
  // Initialize the auth reducer with initial state
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Function to extract roles and permissions from claims
  const processUserRolesAndPermissions = useCallback(async (token: string) => {
    // Extract information from token
    const parsedToken = parseJwtToken(token);
    const claims = parsedToken ? extractClaims(parsedToken) : [];
    
    try {
      // Get assigned roles from backend service
      const rolesResponse = await roleService.getAllRoles();
      if (rolesResponse.success && rolesResponse.data) {
        dispatch({ type: AuthActionType.SET_ROLES, payload: rolesResponse.data });
        
        // Get permissions for the user
        const userPermissions: string[] = [];
        
        // For each role, get associated permissions
        for (const role of rolesResponse.data) {
          const permissionsResponse = await roleService.getRolePermissions(role.guid);
          if (permissionsResponse.success && permissionsResponse.data) {
            // Extract permission names from role permissions
            const rolePermNames = permissionsResponse.data.map(p => p.permissionName);
            userPermissions.push(...rolePermNames);
          }
        }
        
        // De-duplicate permissions and update state
        const uniquePermissions = Array.from(new Set(userPermissions));
        dispatch({ type: AuthActionType.SET_PERMISSIONS, payload: uniquePermissions });
      }
    } catch (error) {
      console.error('Error fetching roles/permissions:', error);
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Failed to load user roles and permissions' });
    }
  }, []);

  // Function to refresh permissions
  const refreshPermissions = useCallback(async () => {
    if (!state.isAuthenticated || !state.user?.token) return;
    
    dispatch({ type: AuthActionType.SET_LOADING, payload: true });
    await processUserRolesAndPermissions(state.user.token);
    dispatch({ type: AuthActionType.SET_LOADING, payload: false });
  }, [state.isAuthenticated, state.user, processUserRolesAndPermissions]);

  // Process authentication result from MSAL
  const processAuthResult = useCallback(async (account: AccountInfo, accessToken: string) => {
    try {
      console.log('Processing authentication result for account:', account.username);

      // Get user details from the token
      const parsedToken = parseJwtToken(accessToken);
      if (!parsedToken) {
        throw new Error('Invalid token format');
      }

      // Extract claims and map to user object
      const tokenClaims = extractClaims(parsedToken);
      const user: UserInfo = {
        id: account.localAccountId,
        displayName: account.name || account.username,
        email: account.username,
        givenName: typeof tokenClaims === 'object' && 'given_name' in tokenClaims ? tokenClaims.given_name as string : undefined,
        surname: typeof tokenClaims === 'object' && 'family_name' in tokenClaims ? tokenClaims.family_name as string : undefined,
        username: account.username,
        claims: Object.entries(tokenClaims).map(([type, value]) => ({ type, value: String(value) })),
        token: accessToken
      };

      // Log the authentication success for debugging
      console.log('Authentication successful - storing user state');

      // Store user data for later session restoration
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set MSAL active account to ensure token renewals work properly
      if (account) {
        msalInstance.setActiveAccount(account);
      }

      // Update state
      dispatch({ type: AuthActionType.SET_USER, payload: user });

      // Fetch roles and permissions
      try {
        console.log('Fetching user roles and permissions...');
        const roles = await roleService.getUserRoles(accessToken);
        dispatch({ type: AuthActionType.SET_ROLES, payload: roles });

        // Extract and flatten all permissions from all roles
        const allPermissions = roles.flatMap(role => 
          role.rolePermissions?.map((p: RolePermission) => p.permissionName) || []
        );
        dispatch({ type: AuthActionType.SET_PERMISSIONS, payload: allPermissions });
        console.log('Roles and permissions set successfully');
      } catch (roleError) {
        console.error('Error fetching roles:', roleError);
      }

      return true;
    } catch (error) {
      console.error('Error processing auth result:', error);
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Failed to process authentication: ' + (error instanceof Error ? error.message : String(error)) });
      return false;
    }
  }, [dispatch]);

  // Login function using MSAL
  const login = useCallback(async (): Promise<boolean> => {
    dispatch({ type: AuthActionType.SET_LOADING, payload: true });
    
    try {
      console.log('Starting login process with MSAL...');
      
      // Force interactive login with popup
      // This ensures the Azure AD authentication dialog appears
      const response = await msalInstance.loginPopup(loginRequest);
      console.log('Login response received:', response);
      
      if (response && response.accessToken) {
        console.log('Access token received, processing result...');
        const success = await processAuthResult(response.account, response.accessToken);
        dispatch({ type: AuthActionType.SET_LOADING, payload: false });
        return success;
      } else {
        console.error('No access token in response');
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Could not acquire token' });
        dispatch({ type: AuthActionType.SET_LOADING, payload: false });
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Authentication failed: ' + (error instanceof Error ? error.message : String(error)) });
      dispatch({ type: AuthActionType.SET_LOADING, payload: false });
      return false;
    }
  }, [processAuthResult]);

  // Get access token function
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) return null;
      
      const request = {
        scopes: loginRequest.scopes,
        account: accounts[0]
      };
      
      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Token expired or requires interactive login
        try {
          // Try popup acquisition
          const response = await msalInstance.acquireTokenPopup(loginRequest);
          return response.accessToken;
        } catch (err) {
          console.error('Token acquisition failed:', err);
          return null;
        }
      }
      console.error('Failed to get access token:', error);
      return null;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    const logoutRequest = {
      account: msalInstance.getActiveAccount()
    };
    
    msalInstance.logoutPopup(logoutRequest).catch(error => {
      console.error('Logout error:', error);
    });
    
    // Remove token and reset state
    localStorage.removeItem('user');
    dispatch({ type: AuthActionType.SIGN_OUT });
  }, []);

  // Handle account and token changes
  useEffect(() => {
    // Register event callbacks for MSAL
    const callbackId = msalInstance.addEventCallback((event) => {
      console.log('MSAL event:', event.eventType);
      
      if (event.eventType === EventType.LOGIN_SUCCESS) {
        if (event.payload) {
          const payload = event.payload as any;
          msalInstance.setActiveAccount(payload.account);
          console.log('Login success, account set:', payload.account);
          
          // If we have an accessToken, store it
          if (payload.accessToken) {
            console.log('Storing access token after login');
            // Process auth result and update state
            processAuthResult(payload.account, payload.accessToken)
              .then(() => console.log('Auth state updated after login'))
              .catch(err => console.error('Failed to process auth result:', err));
          }
        }
      }
    });
    
    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, [processAuthResult]);

  // Handle redirect responses from MSAL
  useEffect(() => {
    const handleRedirectResponse = async () => {
      try {
        // Check if we have a redirect response from Azure AD
        const response = await msalInstance.handleRedirectPromise();
        console.log('Redirect response:', response);
        
        if (response) {
          // We have a response from a redirect
          console.log('Received redirect response with account:', response.account);
          await processAuthResult(response.account, response.accessToken);
        }
      } catch (error) {
        console.error('Error handling redirect:', error);
      }
    };
    
    handleRedirectResponse();
  }, [processAuthResult]);
  
  // Check for existing accounts/token on startup
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: AuthActionType.SET_LOADING, payload: true });
      
      try {
        // Check if we have active accounts
        const accounts = msalInstance.getAllAccounts();
        console.log('Active accounts:', accounts);
        
        if (accounts.length > 0) {
          // Set the active account
          msalInstance.setActiveAccount(accounts[0]);
          
          // Try to get a token silently
          try {
            const silentRequest = {
              scopes: loginRequest.scopes,
              account: accounts[0]
            };
            
            const response = await msalInstance.acquireTokenSilent(silentRequest);
            console.log('Silent token acquisition successful:', response);
            
            if (response) {
              // We have a token, update our auth state
              await processAuthResult(response.account, response.accessToken);
            }
          } catch (tokenError) {
            console.error('Silent token acquisition failed:', tokenError);
            // We'll stay logged out and the user can manually log in
          }
        } else {
          console.log('No active accounts found');
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Session initialization failed' });
      } finally {
        dispatch({ type: AuthActionType.SET_LOADING, payload: false });
      }
    };
    
    initAuth();
  }, [processAuthResult]);

  // Permission checking function
  const hasPermission = useCallback((permission: string): boolean => {
    if (!state.permissions || !permission) return false;
    return state.permissions.includes(permission);
  }, [state.permissions]);

  // Role checking function
  const hasRole = useCallback((roleName: string): boolean => {
    if (!state.roles || !roleName) return false;
    return state.roles.some(role => role.roleName === roleName);
  }, [state.roles]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...state,
    login,
    logout,
    // Alias methods for backward compatibility with proper signature
    signIn: async (email?: string, password?: string) => {
      try {
        console.log('signIn called, triggering MSAL popup directly...');
        dispatch({ type: AuthActionType.SET_LOADING, payload: true });
        
        // Force interactive login with popup directly from signIn
        // This ensures the Azure AD authentication dialog appears
        const response = await msalInstance.loginPopup(loginRequest);
        console.log('SSO Login response received:', response);
        
        if (response && response.accessToken) {
          // Process the login result
          const success = await processAuthResult(response.account, response.accessToken);
          dispatch({ type: AuthActionType.SET_LOADING, payload: false });
          
          // Return in format compatible with old code
          return { isOk: true, data: state.user };
        } else {
          dispatch({ type: AuthActionType.SET_LOADING, payload: false });
          return { isOk: false, message: 'Could not acquire token' };
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        dispatch({ type: AuthActionType.SET_LOADING, payload: false });
        return { isOk: false, message: error instanceof Error ? error.message : 'Authentication failed' };
      }
    },
    signOut: logout,
    getAccessToken,
    hasPermission,
    hasRole,
    refreshPermissions
  }), [state, login, logout, getAccessToken, hasPermission, hasRole, refreshPermissions]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 * @returns The auth context value
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextProps {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
