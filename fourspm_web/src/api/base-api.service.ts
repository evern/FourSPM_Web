import { User } from '../types';
import { PublicClientApplication } from '@azure/msal-browser';

// Import constants from msal-auth
import { API_SCOPES } from '../contexts/msal-auth';

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  useMsal?: boolean; // Flag to use MSAL for token acquisition instead of localStorage
  msalInstance?: PublicClientApplication; // Optional MSAL instance for token acquisition
}

class BaseApiService {
  /**
   * Makes an API request with consistent error handling and authentication
   * @param url The URL to send the request to
   * @param options Request options like method, headers, body
   * @returns Promise with the fetch Response
   */
  async request(url: string, options: RequestOptions = {}): Promise<Response> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Check if we should use MSAL for token acquisition
    if (options.useMsal && options.msalInstance) {
      try {
        // Get the active account from MSAL
        const account = options.msalInstance.getActiveAccount();
        if (account) {
          // Try to acquire a token silently
          const request = {
            scopes: [API_SCOPES.USER],
            account: account
          };
          
          const response = await options.msalInstance.acquireTokenSilent(request);
          if (response && response.accessToken) {
            defaultHeaders['Authorization'] = `Bearer ${response.accessToken}`;
          }
        }
      } catch (error) {
        console.error('Failed to acquire MSAL token:', error);
      }
    } else {
      // Fallback to localStorage token if MSAL is not specified
      const userStr = localStorage.getItem('user');
      const user: User | null = userStr ? JSON.parse(userStr) : null;
      if (user?.token) {
        defaultHeaders['Authorization'] = `Bearer ${user.token}`;
      }
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
        if (response.status === 401) {
          // Clear stored user data and redirect to login
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }

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
}

// Export a singleton instance
export const baseApiService = new BaseApiService();

// For backward compatibility, export the request method directly
export const apiRequest = baseApiService.request.bind(baseApiService);
