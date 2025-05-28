import { baseApiService } from './base-api.service';


export type ODataResponse<T> = {
  value: T[];
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
};


export class ApiService {

  private getHeaders(method: string = 'GET'): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    

    if (['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())) {
      headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
    }
    

    if (method.toUpperCase() === 'PATCH') {

      headers['Prefer'] = 'return=minimal';
    } else if (method.toUpperCase() === 'POST') {

      headers['Prefer'] = 'return=representation';
    }
    
    return headers;
  }


  private async parseError(response: Response, endpoint?: string): Promise<Error> {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();

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
    

    const logMessage = endpoint ? 
      `Error from ${endpoint}: ${errorMessage}` : 
      `API error: ${errorMessage}`;
    console.error(logMessage);
    
    return new Error(errorMessage);
  }


  async get<T = any>(url: string, token: string, query?: Record<string, any>): Promise<T> {

    const queryString = query ? `?${new URLSearchParams(query).toString()}` : '';
    const fullUrl = `${url}${queryString}`;


    
    if (!token) {
      throw new Error('Authentication token is required for API requests');
    }
    

    const response = await baseApiService.request(fullUrl, {
      method: 'GET',
      headers: this.getHeaders('GET'),
      token // Pass token to the baseApiService
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
  async post<T = any>(url: string, data: any, token: string): Promise<T> {

    
    if (!token) {
      throw new Error('Authentication token is required for API requests');
    }
    
    const response = await baseApiService.request(url, {
      method: 'POST',
      headers: this.getHeaders('POST'),
      body: JSON.stringify(data),
      token // Pass token to the baseApiService
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
  async put<T = any>(url: string, data: any, token: string): Promise<T> {

    
    if (!token) {
      throw new Error('Authentication token is required for API requests');
    }
    
    const response = await baseApiService.request(url, {
      method: 'PUT',
      headers: this.getHeaders('PUT'),
      body: JSON.stringify(data),
      token // Pass token to the baseApiService
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
  async patch<T = any>(url: string, data: any, token: string, returnRepresentation: boolean = false): Promise<T> {

    
    if (!token) {
      throw new Error('Authentication token is required for API requests');
    }
    
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
   * @param token Authentication token
   * @param id Optional ID to append in OData format
   * @returns A promise that resolves when the request is complete
   */
  async delete(endpoint: string, token: string, id?: string): Promise<void> {
    const url = id ? `${endpoint}(${id})` : endpoint;

    
    if (!token) {
      throw new Error('Authentication token is required for API requests');
    }
    
    const response = await baseApiService.request(url, {
      method: 'DELETE',
      headers: this.getHeaders('DELETE'),
      token // Pass token to the baseApiService
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
  async getAll<T>(endpoint: string, token: string, query?: Record<string, any>): Promise<ODataResponse<T>> {
    // OData system query options ($select, $filter, $expand, etc) are passed in the query parameter
    return this.get<ODataResponse<T>>(endpoint, token, query);
  }

  /**
   * Get a single item by ID from an OData endpoint
   * @param endpoint The base endpoint URL
   * @param id The ID of the item to retrieve
   * @param query Optional query parameters
   * @returns Promise resolving to the item
   */
  async getById<T>(endpoint: string, id: string, token: string, expand?: string): Promise<T> {
    const query: Record<string, any> = {};
    if (expand) {
      query.$expand = expand;
    }
    const queryString = Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : '';
    return this.get<T>(`${endpoint}(${id})${queryString}`, token, undefined);
  }

  /**
   * Create a new item
   * @param endpoint The base endpoint URL
   * @param data The data to send
   * @returns Promise resolving to the created item
   */
  async create<T>(endpoint: string, data: any, token: string): Promise<T> {
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
  async update<T>(endpoint: string, id: string, data: any, token: string, returnRepresentation: boolean = false): Promise<T> {
    // This supports the OData convention of parentheses notation for entity keys
    return this.patch<T>(`${endpoint}(${id})`, data, token, returnRepresentation);
  }

  /**
   * Delete an item by ID
   * @param endpoint The base endpoint URL
   * @param id The ID of the item to delete
   * @returns Promise that resolves when the deletion is complete
   */
  async deleteById(endpoint: string, id: string, token: string): Promise<void> {
    return this.delete(`${endpoint}(${id})`, token);
  }
}


export const apiService = new ApiService();
