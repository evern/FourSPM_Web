import { User } from '../../types';

export interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
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

    // Get the stored user data and add the token to headers if available
    const userStr = localStorage.getItem('user');
    const user: User | null = userStr ? JSON.parse(userStr) : null;
    if (user?.token) {
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
      console.log('Making request to:', url);
      console.log('With options:', JSON.stringify(mergedOptions, null, 2));
      
      const response = await fetch(url, mergedOptions);
      console.log('Response status:', response.status);
      
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
