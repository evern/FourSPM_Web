import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../auth/msalConfig';
import { useAuth } from '../auth/auth-context';

/**
 * Options for API requests, extending the standard fetch RequestInit
 */
export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  skipTokenRefresh?: boolean; // Optional flag to skip token refresh attempts for public endpoints
}

/**
 * Creates and returns an API service with MSAL integration
 */
export function createMsalApiService() {
  /**
   * Makes an API request with MSAL token authentication and consistent error handling
   * @param url The URL to send the request to
   * @param options Request options including headers, method, body
   * @returns Promise with the fetch Response
   */
  async function request(url: string, options: RequestOptions = {}): Promise<Response> {
    // Default headers for all requests
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get the current authentication token from useAuth context
    const auth = useAuth();
    
    if (auth.user?.token && !options.skipTokenRefresh) {
      defaultHeaders['Authorization'] = `Bearer ${auth.user.token}`;
    }

    const mergedOptions: RequestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        // Handle 401 Unauthorized specifically
        if (response.status === 401 && !options.skipTokenRefresh) {
          // Token might be expired, attempt to get a new one
          try {
            // Try a silent token refresh
            await refreshToken();
            
            // Retry the request with the new token
            return request(url, options);
          } catch (tokenError) {
            console.error('Failed to refresh token:', tokenError);
            // Redirect to login page if token refresh fails
            window.location.hash = '#/login';
            throw new Error('Session expired. Please log in again.');
          }
        }

        // Handle other error responses
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('Network error - Check if the server is running and accessible');
        throw new Error('Unable to connect to the server. Please check if the server is running.');
      }
      
      throw error;
    }
  }

  /**
   * Attempts to refresh the access token silently using MSAL
   */
  async function refreshToken(): Promise<string | null> {
    const { instance, accounts } = useMsal();
    const account = accounts[0];
    
    if (!account) {
      throw new Error('No active account');
    }
    
    try {
      // Try to get a new token silently
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account
      });
      
      return response.accessToken;
    } catch (error) {
      // If silent token acquisition fails, try interactive
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const response = await instance.acquireTokenPopup(loginRequest);
          return response.accessToken;
        } catch (interactiveError) {
          console.error('Error during interactive token acquisition', interactiveError);
          return null;
        }
      }
      
      throw error;
    }
  }

  /**
   * Creates JSON body content for POST/PUT requests
   * @param data The data object to convert to JSON
   * @returns RequestOptions with proper content-type headers and body
   */
  function createJsonBody(data: any): RequestOptions {
    return {
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  }

  return {
    request,
    refreshToken,
    createJsonBody
  };
}

// Create service
const msalApiService = createMsalApiService();

// Export individual functions for convenience
export const msalApiRequest = msalApiService.request;
export const refreshMsalToken = msalApiService.refreshToken;
export const createJsonBody = msalApiService.createJsonBody;
