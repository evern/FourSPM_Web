import { API_CONFIG } from '../config/api';
import { PublicClientApplication, SilentRequest, InteractionRequiredAuthError } from '@azure/msal-browser';

export interface ODataResponse<T> {
  value: T[];
  '@odata.count'?: number;
}

export class ODataService {
  private msalInstance?: PublicClientApplication;
  
  constructor(msalInstance?: PublicClientApplication) {
    this.msalInstance = msalInstance;
  }

  /**
   * Get an authentication token using MSAL
   * @param forceRefresh Whether to force refresh the token
   * @param allowInteractive Whether to allow interactive authentication if silent auth fails
   * @returns A promise resolving to the authentication token, or null if authentication fails
   */
  private async getMsalToken(forceRefresh: boolean = false, allowInteractive: boolean = true): Promise<string | null> {
    if (!this.msalInstance) {
      console.warn('ODataService: No MSAL instance provided');
      return null;
    }
    
    try {
      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        console.warn('ODataService: No active account found in MSAL');
        return null;
      }
      
      const request: SilentRequest = {
        scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User'],
        account: account,
        forceRefresh: forceRefresh
      };
      
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      // Check if this is an interaction required error
      if (error instanceof InteractionRequiredAuthError && allowInteractive) {
        console.log('ODataService: Silent token acquisition failed, attempting interactive acquisition');
        try {
          // Try to get token interactively
          const response = await this.msalInstance.acquireTokenPopup({
            scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User']
          });
          return response.accessToken;
        } catch (interactiveError) {
          console.error('ODataService: Interactive token acquisition failed:', interactiveError);
          return null;
        }
      } else {
        console.error('ODataService: Failed to acquire MSAL token:', error);
        return null;
      }
    }
  }

  /**
   * Get headers for API requests
   * @param token The authentication token
   * @param method The HTTP method (GET, POST, PATCH, DELETE)
   * @returns Headers object with appropriate values for the request
   */
  private getHeaders(token: string, method: string = 'GET') {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
    
    if (['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())) {
      headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
    }
    
    // Add specific headers for OData operations
    if (method.toUpperCase() === 'PATCH') {
      headers['Prefer'] = 'return=minimal';
    } else if (method.toUpperCase() === 'POST') {
      headers['Prefer'] = 'return=representation';
    }
    
    return headers;
  }

  /**
   * Perform a GET request to fetch data from an OData endpoint
   * @param endpoint The base endpoint URL
   * @param query Optional query string to append to the URL
   * @returns Promise resolving to the OData response
   */
  async get<T>(endpoint: string, query?: string): Promise<ODataResponse<T>> {
    const url = query ? `${endpoint}?${query}` : endpoint;
    
    // Get token using MSAL
    const token = await this.getMsalToken();
    if (!token) {
      throw new Error('Authentication token required for API request');
    }
    
    console.log(`ODataService: GET request to ${url.substring(0, 100)}${url.length > 100 ? '...' : ''}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token, 'GET')
      });

      if (!response.ok) {
        // Try to extract error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = `${errorData.error.code || response.status}: ${errorData.error.message || errorMessage}`;
          }
        } catch (e) {
          // If error parsing fails, use the default message
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`ODataService: Error in GET request to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Perform a POST request to create an entity
   * @param endpoint The base endpoint URL
   * @param data The data to send in the request body
   * @returns Promise resolving to the created entity
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    // Get token using MSAL
    const token = await this.getMsalToken();
    if (!token) {
      throw new Error('Authentication token required for API request');
    }
    
    console.log(`ODataService: POST request to ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(token, 'POST'),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        // Try to extract error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          // Try to parse as JSON first
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = `${errorData.error.code || response.status}: ${errorData.error.message || errorMessage}`;
            }
          } else {
            // If not JSON, try to get as text
            const errorText = await response.text();
            if (errorText && errorText.length > 0) {
              errorMessage = errorText;
            }
          }
        } catch (e) {
          // If error parsing fails, use the default message
          console.warn('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`ODataService: Error in POST request to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Perform a PATCH request to update an entity
   * @param endpoint The base endpoint URL
   * @param id The ID of the entity to update
   * @param data The partial data to update
   * @returns Promise resolving when update is complete
   */
  async patch<T>(endpoint: string, id: string, data: Partial<T>): Promise<void> {
    // Get token using MSAL
    const token = await this.getMsalToken();
    if (!token) {
      throw new Error('Authentication token required for API request');
    }
    
    const url = `${endpoint}(${id})`;
    console.log(`ODataService: PATCH request to ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(token, 'PATCH'),
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        // Try to extract error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = `${errorData.error.code || response.status}: ${errorData.error.message || errorMessage}`;
            }
          } else {
            const errorText = await response.text();
            if (errorText && errorText.length > 0) {
              errorMessage = errorText;
            }
          }
        } catch (e) {
          // If error parsing fails, use the default message
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`ODataService: Error in PATCH request to ${url}:`, error);
      throw error;
    }
  }

  /**
   * Perform a DELETE request to remove an entity
   * @param endpoint The base endpoint URL
   * @param id The ID of the entity to delete
   * @returns Promise resolving when deletion is complete
   */
  async delete(endpoint: string, id: string): Promise<void> {
    // Get token using MSAL
    const token = await this.getMsalToken();
    if (!token) {
      throw new Error('Authentication token required for API request');
    }
    
    const url = `${endpoint}(${id})`;
    console.log(`ODataService: DELETE request to ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(token, 'DELETE')
      });

      if (!response.ok) {
        // Try to extract error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (errorData && errorData.error) {
              errorMessage = `${errorData.error.code || response.status}: ${errorData.error.message || errorMessage}`;
            }
          } else {
            const errorText = await response.text();
            if (errorText && errorText.length > 0) {
              errorMessage = errorText;
            }
          }
        } catch (e) {
          // If error parsing fails, use the default message
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`ODataService: Error in DELETE request to ${url}:`, error);
      throw error;
    }
  }
}
