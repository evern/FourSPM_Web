import { useCallback } from 'react';
import { useAuth } from '../auth/auth-context';
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { loginRequest } from '../auth/msalConfig';

/**
 * Options for API requests, extending the standard fetch RequestInit
 */
export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  skipTokenRefresh?: boolean; // Optional flag to skip token refresh attempts for public endpoints
}

/**
 * Response format for API calls
 */
export interface ApiResponse<T = any> {
  isOk: boolean;
  data?: T;
  message?: string;
}

/**
 * Custom hook for API requests with MSAL authentication
 * @returns API request functions with built-in token handling
 */
export function useApiService() {
  const { user, signOut } = useAuth();
  const { instance, accounts } = useMsal();
  
  /**
   * Attempts to refresh the access token silently using MSAL
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    const account = accounts[0];
    
    if (!account) {
      return null;
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
      
      console.error('Error refreshing token:', error);
      return null;
    }
  }, [accounts, instance]);
  
  /**
   * Makes an API request with MSAL token authentication and consistent error handling
   * @param url The URL to send the request to
   * @param options Request options including headers, method, body
   * @returns Promise with the API response
   */
  const apiRequest = useCallback(async <T>(url: string, options: RequestOptions = {}): Promise<Response> => {
    // Default headers for all requests
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication token if available
    if (user?.token && !options.skipTokenRefresh) {
      defaultHeaders['Authorization'] = `Bearer ${user.token}`;
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
          const newToken = await refreshToken();
          
          if (newToken) {
            // Retry the request with the new token
            const refreshedOptions: RequestOptions = {
              ...mergedOptions,
              headers: {
                ...mergedOptions.headers,
                'Authorization': `Bearer ${newToken}`
              }
            };
            
            return fetch(url, refreshedOptions);
          } else {
            // If token refresh fails, sign out
            signOut();
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
  }, [user, refreshToken, signOut]);
  
  /**
   * Helper function to handle JSON responses and standardize error handling
   */
  const handleApiResponse = useCallback(async <T>(response: Response): Promise<ApiResponse<T>> => {
    try {
      const data = await response.json() as T;
      return { isOk: true, data };
    } catch (error) {
      console.error('Error parsing response:', error);
      return { isOk: false, message: 'Failed to parse response' };
    }
  }, []);
  
  /**
   * Makes a GET request to the specified URL
   */
  const get = useCallback(async <T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const response = await apiRequest<T>(url, {
        method: 'GET',
        ...options
      });
      
      return handleApiResponse<T>(response);
    } catch (error) {
      return { isOk: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiRequest, handleApiResponse]);
  
  /**
   * Makes a POST request to the specified URL
   */
  const post = useCallback(async <T>(url: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const response = await apiRequest<T>(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options
      });
      
      return handleApiResponse<T>(response);
    } catch (error) {
      return { isOk: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiRequest, handleApiResponse]);
  
  /**
   * Makes a PUT request to the specified URL
   */
  const put = useCallback(async <T>(url: string, data: any, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const response = await apiRequest<T>(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options
      });
      
      return handleApiResponse<T>(response);
    } catch (error) {
      return { isOk: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiRequest, handleApiResponse]);
  
  /**
   * Makes a DELETE request to the specified URL
   */
  const del = useCallback(async <T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> => {
    try {
      const response = await apiRequest<T>(url, {
        method: 'DELETE',
        ...options
      });
      
      return handleApiResponse<T>(response);
    } catch (error) {
      return { isOk: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [apiRequest, handleApiResponse]);
  
  return {
    apiRequest,
    refreshToken,
    handleApiResponse,
    get,
    post,
    put,
    del
  };
}
