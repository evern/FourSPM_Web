import React, { useReducer, useEffect, createContext, useContext, useCallback, useMemo, PropsWithChildren } from 'react';
import { PublicClientApplication, EventType, AccountInfo } from '@azure/msal-browser';
import { Role, RolePermission } from '../adapters/role.adapter';
import { msalConfig } from '../config/auth/msalConfig';
import { AUTH_CONFIG } from '../config/auth/authConfig';
import { CommonPermissions } from '../config/permissions';
import { roleService } from '../services/role.service';
import { 
  parseJwtToken, 
  getStoredToken, 
  storeToken, 
  removeToken, 
  extractClaims, 
  isTokenExpired,
  JwtToken 
} from '../api/auth-token.service';

// Define auth state and context interfaces
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
  user?: UserInfo;
  roles: Role[];
  permissions: string[];
  loading: boolean;
  error?: string;
  isAuthenticated: boolean;
}

// Action interface for the reducer
export interface AuthAction {
  type: AuthActionType;
  payload?: any;
}

// Context interface
export interface AuthContextType extends AuthState {
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  signIn: (email?: string, password?: string) => Promise<boolean | { isOk: boolean; data?: UserInfo; message?: string }>;
  signOut: () => void;
  refreshPermissions: () => Promise<void>;
}

// Initial auth state
const initialState: AuthState = {
  user: undefined,
  roles: [],
  permissions: [],
  loading: false,
  isAuthenticated: false,
};

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

// Create context with a default value matching our interface
const AuthContext = createContext<AuthContextType>({
  ...initialState,
  hasPermission: () => false,
  hasRole: () => false,
  signIn: async () => false,
  signOut: () => {},
  refreshPermissions: async () => {},
});

function AuthProvider({ children }: PropsWithChildren<{}>) {
  // Create MSAL application object
  const msalInstance = useMemo(() => new PublicClientApplication(msalConfig), []);
  
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
  const processAuthResult = useCallback(async (account: AccountInfo, token: string) => {
    const claims = parseJwtToken(token)?.payload || {};
    
    // Create user info object from account and token claims
    const userInfo: UserInfo = {
      id: account.localAccountId,
      displayName: account.name || claims.name || '',
      email: account.username,
      givenName: claims.given_name,
      surname: claims.family_name,
      username: account.username,
      token,
      claims: extractClaims(parseJwtToken(token))
    };
    
    // Update user in state
    dispatch({ type: AuthActionType.SET_USER, payload: userInfo });
    
    // Store the token
    storeToken(token, userInfo);
    
    // Process roles and permissions
    await processUserRolesAndPermissions(token);
    
    return true;
  }, [processUserRolesAndPermissions]);

  /**
   * Legacy signIn function wrapper for backward compatibility
   * @deprecated Use the parameter-less version in new code
   */
  const signIn = useCallback(async (email?: string, password?: string): Promise<{ isOk: boolean; data?: UserInfo; message?: string } | boolean> => {
    // If called with no parameters, return a boolean (new pattern)
    if (email === undefined && password === undefined) {
      return authenticateWithMsal();
    }
    
    // Otherwise use legacy format with isOk, data, message (old pattern)
    try {
      const success = await authenticateWithMsal();
      if (success && state.user) {
        return { isOk: true, data: state.user };
      }
      return { isOk: false, message: state.error || 'Authentication failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      return { isOk: false, message: errorMessage };
    }
  }, [state.user, state.error]);

  /**
   * Core authentication function using MSAL
   */
  const authenticateWithMsal = useCallback(async (): Promise<boolean> => {
    dispatch({ type: AuthActionType.SET_LOADING, payload: true });
    
    try {
      // Try silent sign-in first
      const accounts = msalInstance.getAllAccounts();
      
      if (accounts.length > 0) {
        const silentRequest = {
          scopes: AUTH_CONFIG.jwt.scopesForUser,
          account: accounts[0]
        };
        
        try {
          const response = await msalInstance.acquireTokenSilent(silentRequest);
          if (response.accessToken) {
            const success = await processAuthResult(response.account, response.accessToken);
            dispatch({ type: AuthActionType.SET_LOADING, payload: false });
            return success;
          }
        } catch (error) {
          // Silent acquisition failed, fall back to popup
          console.log('Silent token acquisition failed, falling back to popup');
        }
      }
      
      // Fallback to popup sign-in
      const loginRequest = {
        scopes: AUTH_CONFIG.jwt.scopesForUser
      };
      
      const response = await msalInstance.loginPopup(loginRequest);
      if (response.accessToken) {
        const success = await processAuthResult(response.account, response.accessToken);
        dispatch({ type: AuthActionType.SET_LOADING, payload: false });
        return success;
      } else {
        dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Could not acquire token' });
        dispatch({ type: AuthActionType.SET_LOADING, payload: false });
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Authentication failed' });
      dispatch({ type: AuthActionType.SET_LOADING, payload: false });
      return false;
    }
  }, [msalInstance, processAuthResult]);

  // Sign-out function
  const signOut = useCallback(() => {
    const logoutRequest = {
      account: msalInstance.getActiveAccount()
    };
    
    msalInstance.logoutPopup(logoutRequest).catch(error => {
      console.error('Logout error:', error);
    });
    
    // Remove token and reset state
    removeToken();
    dispatch({ type: AuthActionType.SIGN_OUT });
  }, [msalInstance]);

  // Handle account and token changes
  useEffect(() => {
    // Register event callbacks for MSAL
    const callbackId = msalInstance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS) {
        if (event.payload) {
          const payload = event.payload as any;
          msalInstance.setActiveAccount(payload.account);
        }
      }
    });
    
    return () => {
      if (callbackId) {
        msalInstance.removeEventCallback(callbackId);
      }
    };
  }, [msalInstance]);

  // Check for existing token on startup
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: AuthActionType.SET_LOADING, payload: true });
      
      // Check if we have a stored token
      const token = getStoredToken();
      const accounts = msalInstance.getAllAccounts();
      
      if (token && accounts.length > 0) {
        try {
          // Verify token is valid
          const parsedToken = parseJwtToken(token);
          if (parsedToken && !isTokenExpired(parsedToken)) {
            // Valid token, restore session
            await processAuthResult(accounts[0], token);
          } else {
            // Token expired, attempt silent refresh
            await signIn();
          }
        } catch (error) {
          console.error('Error during auth initialization:', error);
          dispatch({ type: AuthActionType.AUTH_ERROR, payload: 'Session restoration failed' });
        }
      }
      
      dispatch({ type: AuthActionType.SET_LOADING, payload: false });
    };
    
    initAuth();
  }, [msalInstance, processAuthResult, signIn]);

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
    hasPermission,
    hasRole,
    signIn,
    signOut,
    refreshPermissions
  }), [state, hasPermission, hasRole, signIn, signOut, refreshPermissions]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook with proper type inference
const useAuth = (): AuthContextType => useContext(AuthContext);

// Export hooks and provider
export { AuthProvider, useAuth };
