import { useMSALAuth } from '../contexts/msal-auth';

// Define the interface based on what MSAL Auth Context provides
interface MSALAuthContextType {
  user?: any;
  loading: boolean;
  error?: string;
  msalInstance?: any;
  signIn: () => Promise<{ isOk: boolean; data?: any; message?: string }>;
  signInWithRole: (admin: boolean) => Promise<{ isOk: boolean; data?: any; message?: string }>;
  signOut: () => void;
  acquireToken: () => Promise<string | null>;
}

/**
 * Creates a request interceptor for adding MSAL auth tokens to API requests
 * This function can be used with various API services to add authorization headers
 * 
 * @param msalAuth The MSAL auth context or a function that returns it
 * @returns A function that modifies request configurations to include auth tokens
 */
export const createMsalRequestInterceptor = (
  msalAuth: MSALAuthContextType | (() => MSALAuthContextType)
) => {
  return async (config: any) => {
    // Initialize headers if they don't exist
    if (!config.headers) {
      config.headers = {};
    }
    
    // Get the MSAL auth context - either directly or by calling the function
    const authContext = typeof msalAuth === 'function' ? msalAuth() : msalAuth;
    
    try {
      // Acquire a token using the MSAL context
      const token = await authContext.acquireToken();
      
      if (token) {
        // Add the token to the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to acquire token for API request:', error);
    }
    
    return config;
  };
};

/**
 * A hook that returns a configured MSAL request interceptor
 * This is convenient for components that need to make authenticated API calls
 * 
 * @returns A function that can be used to add auth tokens to requests
 */
export const useMsalRequestInterceptor = () => {
  const msalAuth = useMSALAuth();
  return createMsalRequestInterceptor(() => msalAuth);
};
