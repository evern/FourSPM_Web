import { API_CONFIG } from '../config/api';
import { baseApiService } from './base-api.service';

/**
 * Define the OData response structure
 * This matches the standard OData response format with value array and count metadata
 */
export type ODataResponse<T> = {
  value: T[];
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
};

/**
 * Combined API service that provides OData protocol handling and high-level API operations.
 * Authentication is handled by the auth interceptor.
 */
export class ApiService {
  /**
   * Get headers for API requests with proper OData formatting
   * @param method The HTTP method (GET, POST, PATCH, DELETE)
   * @returns Headers object with appropriate values for the request
   */
  private getHeaders(method: string = 'GET'): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    // Add OData-specific content type headers for data modification operations
    if (['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())) {
      headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
    }
    
    // Add specific headers for OData operations
    if (method.toUpperCase() === 'PATCH') {
      // Tell server to return minimal response for updates
      headers['Prefer'] = 'return=minimal';
    } else if (method.toUpperCase() === 'POST') {
      // Tell server to return the new entity after creation
      headers['Prefer'] = 'return=representation';
    }
    
    return headers;
  }

  /**
   * Parse error response from API with improved OData error handling
   * @param response The fetch response object
   * @param endpoint The endpoint that was called (for logging)
   * @returns A rejected promise with the error details
   */
  private async parseError(response: Response, endpoint?: string): Promise<Error> {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        // Handle standard OData error format
        if (errorData?.error) {
          if (errorData.error.code && errorData.error.message) {
            errorMessage = `${errorData.error.code}: ${errorData.error.message}`;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else {
        const errorText = await response.text();
        if (errorText && errorText.length > 0) {
          errorMessage = errorText;
        }
      }
    } catch (e) {
      console.warn('Failed to parse error response:', e);
    }
    
    // Log detailed error for debugging
    const logMessage = endpoint ? 
      `Error from ${endpoint}: ${errorMessage}` : 
      `API error: ${errorMessage}`;
    console.error(logMessage);
    
    return new Error(errorMessage);
  }

  /**
   * Make a GET request to the API with OData support
   * @param url The URL to fetch
   * @param query Optional query parameters
   * @returns A promise resolving to the response data
   */
  async get<T = any>(url: string, query?: Record<string, any>, token?: string): Promise<T> {
    // Handle OData-specific parameters ($select, $expand, etc)
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    const fullUrl = `${url}${queryString}`;

    console.log(`ApiService: GET request to ${fullUrl.substring(0, 100)}${fullUrl.length > 100 ? '...' : ''}`);
    
    // Use baseApiService.request which supports passing token explicitly
    const response = await baseApiService.request(fullUrl, {
      method: 'GET',
      headers: this.getHeaders('GET'),
      token: token // Pass token to the baseApiService
    });

    if (!response.ok) {
      throw await this.parseError(response, url);
    }

    return response.json();
  }

  /**
   * Make a POST request to the API
   * @param url The URL to post to
   * Make a POST request to the API with improved error handling
   * @param url The URL to post to
   * @param data The data to send
   * @returns A promise resolving to the response data
   */
  async post<T = any>(url: string, data: any, token?: string): Promise<T> {
    console.log(`ApiService: POST request to ${url}`);
    
    const response = await baseApiService.request(url, {
      method: 'POST',
      headers: this.getHeaders('POST'),
      body: JSON.stringify(data),
      token: token // Pass token to the baseApiService
    });

    if (!response.ok) {
      throw await this.parseError(response, url);
    }

    return response.json();
  }

  /**
   * Make a PUT request to the API
   * @param url The URL to put to
   * @param data The data to send
   * @returns A promise resolving to the response data
   */
  async put<T = any>(url: string, data: any, token?: string): Promise<T> {
    console.log(`ApiService: PUT request to ${url}`);
    
    const response = await baseApiService.request(url, {
      method: 'PUT',
      headers: this.getHeaders('PUT'),
      body: JSON.stringify(data),
      token: token // Pass token to the baseApiService
    });

    if (!response.ok) {
      throw await this.parseError(response, url);
    }

    return response.json();
  }

  /**
   * Make a PATCH request to the API
   * @param url The URL to patch
   * @param data The data to send
   * @returns A promise resolving to the response data
   */
  /**
   * Make a PATCH request to the API with improved error handling
   * @param url The URL to patch
   * @param data The data to send
   * @param returnRepresentation Whether to request full entity from server after update
   * @returns A promise resolving to the response data
   */
  async patch<T = any>(url: string, data: any, returnRepresentation: boolean = false, token?: string): Promise<T> {
    console.log(`ApiService: PATCH request to ${url}`);
    
    // Set up headers specific to the PATCH operation
    const headers = this.getHeaders('PATCH');
    
    // Override Prefer header if full representation is requested
    if (returnRepresentation) {
      headers['Prefer'] = 'return=representation';
    }
    
    const response = await baseApiService.request(url, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(data),
      token: token // Pass token to the baseApiService
    });

    if (!response.ok) {
      throw await this.parseError(response, url);
    }

    // For minimal returns, just create an empty response
    if (headers['Prefer'] === 'return=minimal' && response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  /**
   * Make a DELETE request to the API
   * Make a DELETE request to the API with improved error handling
   * @param endpoint The base endpoint URL
   * @param id Optional ID to append in OData format
   * @returns A promise that resolves when the request is complete
   */
  async delete(endpoint: string, id?: string, token?: string): Promise<void> {
    const url = id ? `${endpoint}(${id})` : endpoint;
    console.log(`ApiService: DELETE request to ${url}`);
    
    const response = await baseApiService.request(url, {
      method: 'DELETE',
      headers: this.getHeaders('DELETE'),
      token: token // Pass token to the baseApiService
    });

    if (!response.ok) {
      throw await this.parseError(response, endpoint);
    }
  }

  /**
   * Get all items from an OData endpoint
   * @param endpoint The base endpoint URL
   * Get all items from an OData endpoint with support for standard query options
   * @param endpoint The base endpoint URL
   * @param query Optional query parameters including OData system parameters
   * @returns Promise resolving to the full OData response
   */
  async getAll<T>(endpoint: string, query?: Record<string, any>, token?: string): Promise<ODataResponse<T>> {
    // OData system query options ($select, $filter, $expand, etc) are passed in the query parameter
    return this.get<ODataResponse<T>>(endpoint, query, token);
  }

  /**
   * Get a single item by ID from an OData endpoint
   * @param endpoint The base endpoint URL
   * @param id The ID of the item to retrieve
   * @param query Optional query parameters
   * @returns Promise resolving to the item
   */
  async getById<T>(endpoint: string, id: string, expand?: string, token?: string): Promise<T> {
    const query: Record<string, any> = {};
    if (expand) {
      query.$expand = expand;
    }
    const queryString = Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : '';
    return this.get<T>(`${endpoint}(${id})${queryString}`, undefined, token);
  }

  /**
   * Create a new item
   * @param endpoint The base endpoint URL
   * @param data The data to send
   * @returns Promise resolving to the created item
   */
  async create<T>(endpoint: string, data: any, token?: string): Promise<T> {
    return this.post<T>(endpoint, data, token);
  }

  /**
   * Update an existing item
   * @param endpoint The base endpoint URL
   * @param id The ID of the item to update
   * Update an existing item with optional full entity return
   * @param endpoint The base endpoint URL
   * @param id The ID of the item to update
   * @param data The data to update
   * @param returnRepresentation Whether to request the server to return the full updated entity
   * @returns Promise resolving to the updated entity or empty object
   */
  async update<T>(endpoint: string, id: string, data: any, returnRepresentation: boolean = false, token?: string): Promise<T> {
    // This supports the OData convention of parentheses notation for entity keys
    return this.patch<T>(`${endpoint}(${id})`, data, returnRepresentation, token);
  }

  /**
   * Delete an item by ID
   * @param endpoint The base endpoint URL
   * @param id The ID of the item to delete
   * @returns Promise that resolves when the deletion is complete
   */
  async deleteById(endpoint: string, id: string, token?: string): Promise<void> {
    return this.delete(`${endpoint}(${id})`, undefined, token);
  }
}

// Export a singleton instance
/**
 * Export a singleton instance of the API service
 * This ensures consistent usage across the application and follows the singleton pattern
 */
export const apiService = new ApiService();
