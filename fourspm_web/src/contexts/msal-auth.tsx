import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { 
  PublicClientApplication, 
  AuthenticationResult, 
  AccountInfo, 
  InteractionType,
  InteractionRequiredAuthError,
  BrowserAuthErrorMessage,
  Configuration,
  PopupRequest,
  SilentRequest,
  EndSessionRequest
} from '@azure/msal-browser';
import { User } from '@/types';

// Define MSAL configuration
const msalConfig: Configuration = {
  auth: {
    clientId: 'c67bf91d-8b6a-494a-8b99-c7a4592e08c1',
    authority: 'https://login.microsoftonline.com/3c7fa9e9-64e7-443c-905a-d9134ca00da9',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true
  },
};

// Define request scopes
const loginRequest: PopupRequest = {
  scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User']
};

const adminLoginRequest: PopupRequest = {
  scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.Admin']
};

// Define the auth context type
interface MSALAuthContextType {
  user?: User;
  loading: boolean;
  error?: string;
  msalInstance?: PublicClientApplication;
  signIn: () => Promise<{ isOk: boolean; data?: User; message?: string }>;
  signInWithRole: (admin: boolean) => Promise<{ isOk: boolean; data?: User; message?: string }>;
  signOut: () => void;
  acquireToken: () => Promise<string | null>;
}

// Create the MSAL Auth Context
const MSALAuthContext = createContext<MSALAuthContextType>({
  loading: false,
  signIn: async () => ({ isOk: false }),
  signInWithRole: async () => ({ isOk: false }),
  signOut: () => {},
  acquireToken: async () => null
});

// Convert MSAL account to User
const accountToUser = (account: AccountInfo, token: string): User => {
  return {
    id: account.localAccountId,
    email: account.username,
    avatarUrl: '',
    token: token,
    name: account.name || account.username,
  };
};

// MSAL Auth Provider
export function MSALAuthProvider({ children }: PropsWithChildren<{}>) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | undefined>();
  const [user, setUser] = useState<User | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  
  // Initialize MSAL
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Create the MSAL instance
        const instance = new PublicClientApplication(msalConfig);
        
        // Initialize the instance before using it
        await instance.initialize();
        console.log('MSAL instance initialized successfully');
        
        // Now set the instance in state
        setMsalInstance(instance);
        
        // Handle redirect promise
        const authResult = await instance.handleRedirectPromise();
        if (authResult) {
          handleAuthResult(authResult);
        }
      } catch (e: any) {
        console.error('MSAL initialization failed:', e);
        setError(`Failed to initialize MSAL: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeMsal();
  }, []);

  // Check for existing account on load
  useEffect(() => {
    if (msalInstance) {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        attemptSilentSignIn(accounts[0]);
      } else {
        setLoading(false);
      }
    }
  }, [msalInstance]);

  // Handle authentication result
  const handleAuthResult = useCallback((authResult: AuthenticationResult) => {
    if (authResult.account) {
      const userAccount = accountToUser(authResult.account, authResult.accessToken);
      setUser(userAccount);
      
      // Save the account in MSAL
      msalInstance?.setActiveAccount(authResult.account);
    }
  }, [msalInstance]);

  // Attempt silent sign-in
  const attemptSilentSignIn = useCallback(async (account: AccountInfo) => {
    setLoading(true);
    try {
      const silentRequest: SilentRequest = {
        scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User'],
        account: account
      };
      
      const authResult = await msalInstance?.acquireTokenSilent(silentRequest);
      if (authResult) {
        handleAuthResult(authResult);
      }
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Silent token acquisition failed, user must sign in interactively
        setUser(undefined);
      } else {
        setError(`Silent authentication failed: ${(error as Error).message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [msalInstance, handleAuthResult]);

  // Sign in with popup
  const signIn = useCallback(async () => {
    if (!msalInstance) {
      return { isOk: false, message: 'MSAL not initialized' };
    }

    setLoading(true);
    setError(undefined);
    
    try {
      const authResult = await msalInstance.loginPopup(loginRequest);
      handleAuthResult(authResult);
      
      return { 
        isOk: true, 
        data: accountToUser(authResult.account, authResult.accessToken),
      };
    } catch (error: any) {
      // Don't show error for user cancellations
      if (error.errorCode !== BrowserAuthErrorMessage.userCancelledError) {
        setError(`Login failed: ${error.message}`);
      }
      return { isOk: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [msalInstance, handleAuthResult]);

  // Sign in with specific role scope
  const signInWithRole = useCallback(async (admin: boolean) => {
    if (!msalInstance) {
      return { isOk: false, message: 'MSAL not initialized' };
    }

    setLoading(true);
    setError(undefined);
    
    try {
      const request = admin ? adminLoginRequest : loginRequest;
      const authResult = await msalInstance.loginPopup(request);
      handleAuthResult(authResult);
      
      return { 
        isOk: true, 
        data: accountToUser(authResult.account, authResult.accessToken),
      };
    } catch (error: any) {
      // Don't show error for user cancellations
      if (error.errorCode !== BrowserAuthErrorMessage.userCancelledError) {
        setError(`Login failed: ${error.message}`);
      }
      return { isOk: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, [msalInstance, handleAuthResult]);

  // Acquire token for API calls
  const acquireToken = useCallback(async (): Promise<string | null> => {
    if (!msalInstance) {
      setError('MSAL not initialized');
      return null;
    }
    
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      setError('No signed-in account found');
      return null;
    }
    
    const account = accounts[0];
    const request = {
      scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User'],
      account: account
    };
    
    try {
      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        try {
          // Fallback to interactive method
          const response = await msalInstance.acquireTokenPopup(request);
          return response.accessToken;
        } catch (err: any) {
          setError(`Failed to acquire token interactively: ${err.message}`);
          return null;
        }
      } else {
        setError(`Failed to acquire token silently: ${(error as Error).message}`);
        return null;
      }
    }
  }, [msalInstance]);

  // Sign out
  const signOut = useCallback(async () => {
    if (!msalInstance) {
      return;
    }

    const logoutRequest: EndSessionRequest = {
      account: msalInstance.getActiveAccount() || undefined,
      postLogoutRedirectUri: window.location.origin
    };

    try {
      await msalInstance.logoutPopup(logoutRequest);
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setUser(undefined);
  }, [msalInstance]);

  // Token refresh logic
  useEffect(() => {
    if (!user || !msalInstance) return;

    // Setup token refresh
    const tokenRefreshInterval = setInterval(async () => {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        try {
          const silentRequest: SilentRequest = {
            scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User'],
            account: account,
            forceRefresh: true
          };
          
          const response = await msalInstance.acquireTokenSilent(silentRequest);
          if (response) {
            // Update user with fresh token
            setUser(prev => prev ? {
              ...prev,
              token: response.accessToken
            } : undefined);
          }
        } catch (error) {
          console.warn('Token refresh failed:', error);
        }
      }
    }, 15 * 60 * 1000); // Refresh token every 15 minutes

    return () => clearInterval(tokenRefreshInterval);
  }, [user, msalInstance]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    error,
    msalInstance,
    signIn,
    signInWithRole,
    signOut,
    acquireToken
  }), [user, loading, error, msalInstance, signIn, signInWithRole, signOut, acquireToken]);

  return (
    <MSALAuthContext.Provider value={contextValue}>
      {children}
    </MSALAuthContext.Provider>
  );
}

// Custom hook for accessing auth context
export const useMSALAuth = (): MSALAuthContextType => useContext(MSALAuthContext);

// Create an API interceptor for adding auth tokens
export const createMsalApiInterceptor = (msalAuth: MSALAuthContextType) => {
  return async (config: any) => {
    if (!config.headers) {
      config.headers = {};
    }
    
    try {
      const token = await msalAuth.acquireToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to acquire token for API request:', error);
    }
    
    return config;
  };
};

export default MSALAuthProvider;
