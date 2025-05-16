import { User } from '../types';

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
  skipTokenRefresh?: boolean; // Optional flag to skip token refresh attempts for public endpoints
}

/**
 * Token store for managing access tokens outside of React components
 */
class TokenStore {
  private static token: string | null = null;
  
  /**
   * Sets the active token
   */
  static setToken(token: string | null): void {
    TokenStore.token = token;
  }
  
  /**
   * Gets the active token
   */
  static getToken(): string | null {
    return TokenStore.token;
  }
}

/**
 * Export token store methods for use in authentication context
 */
export const setApiToken = TokenStore.setToken;
export const getApiToken = TokenStore.getToken;

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

    // Get the token from TokenStore
    const token = TokenStore.getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
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
          // Session has expired - we'll let the auth component handle this
          // This will be handled by the AuthProvider which monitors account state
          // Just log and throw a standardized error
          console.error('Authentication token expired or invalid');
          
          // Clear the stored token so new requests won't use the expired token
          TokenStore.setToken(null);
          
          // Use hash router navigation format for redirection
          window.location.hash = '#/login';
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
