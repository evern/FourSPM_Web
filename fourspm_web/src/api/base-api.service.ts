import { User } from '../types';
import { PublicClientApplication } from '@azure/msal-browser';

// Import constants from msal-auth
import { API_SCOPES } from '../contexts/msal-auth';

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  token: string; // Authentication token - temporarily optional during refactoring
}

class BaseApiService {
  /**
   * Makes an API request with consistent error handling and authentication
   * @param url The URL to send the request to
   * @param options Request options like method, headers, body
   * @returns Promise with the fetch Response
   */
  async request(url: string, options: RequestOptions): Promise<Response> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add the authorization header if token is provided
    if (options.token) {
      defaultHeaders['Authorization'] = `Bearer ${options.token}`;
    } else {
      console.warn('No token provided for API request. This may cause authentication errors.');
    }

    // Merge default headers with headers from options
    const mergedHeaders = {
      ...defaultHeaders,
      ...options.headers,
    };
    
    // Create a new options object with merged headers
    const mergedOptions = {
      ...options,
      headers: mergedHeaders
    };

    try {
      // Make the API request
      const response = await fetch(url, mergedOptions);
      
      // Check if the response is ok (status 200-299)
      if (!response.ok) {
        // For 401 errors, clear the token and redirect to login
        if (response.status === 401) {
          console.error('Unauthorized API request');
          // The TokenContext will handle token refresh and redirect if needed
        }

        // For other errors, handle them based on status code
        console.error(`API error ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
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
