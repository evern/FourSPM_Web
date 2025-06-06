import { ODataService, ODataResponse } from './odata.service';

/**
 * SharedApiService provides reusable API methods for common operations
 * across multiple domain services
 */
class SharedApiService {
  private odataService: ODataService;

  constructor() {
    this.odataService = new ODataService();
  }

  /**
   * Generic method to perform a direct GET request to an API endpoint
   * @param url Full endpoint URL including query parameters
   * @param token Auth token
   * @returns Promise resolving to the API response
   */
  async get<T>(url: string, token: string): Promise<T> {
    if (!token) {
      throw new Error('No auth token provided');
    }

    try {
      const response = await this.odataService.get<T>(url, token);
      return response as unknown as T;
    } catch (error: any) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to get an entity by ID
   * @param endpoint OData endpoint path
   * @param id Entity ID
   * @param token Auth token
   * @param query Optional query string (e.g. $expand=Related)
   * @returns Promise resolving to the entity
   */
  async getById<T>(endpoint: string, id: string, token: string, query?: string): Promise<T> {
    if (!token) {
      throw new Error('No auth token provided');
    }

    if (!id) {
      throw new Error(`No ID provided for ${endpoint}`);
    }

    try {
      const queryParam = query ? `?${query}` : '';
      const response = await this.odataService.get<T>(`${endpoint}(${id})${queryParam}`, token);
      return response as unknown as T;
    } catch (error: any) {
      console.error(`Error fetching ${endpoint} by ID:`, error);
      throw error;
    }
  }

  /**
   * Generic method to get all entities from an endpoint
   * @param endpoint OData endpoint path
   * @param token Auth token
   * @param query Optional query string
   * @returns Promise resolving to array of entities
   */
  async getAll<T>(endpoint: string, token: string, query?: string): Promise<T[]> {
    if (!token) {
      throw new Error('No auth token provided');
    }

    try {
      const response = await this.odataService.get<T>(endpoint, token, query);
      return response.value || [];
    } catch (error: any) {
      console.error(`Error fetching all ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to create or update an entity with POST
   * @param endpoint OData endpoint path
   * @param token Auth token
   * @param data Data to send
   * @returns Promise resolving to the created/updated entity
   */
  async post<T>(endpoint: string, token: string, data: any): Promise<T> {
    if (!token) {
      throw new Error('No auth token provided');
    }

    try {
      return this.odataService.post<T>(endpoint, token, data);
    } catch (error: any) {
      console.error(`Error posting to ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to update an entity
   * @param endpoint OData endpoint path
   * @param id Entity ID
   * @param data Update data
   * @param token Auth token
   * @returns Promise that resolves when update is complete
   */
  async update<T>(endpoint: string, id: string, data: Partial<T>, token: string): Promise<void> {
    if (!token) {
      throw new Error('No auth token provided');
    }

    if (!id) {
      throw new Error(`No ID provided for ${endpoint} update`);
    }

    try {
      await this.odataService.patch<T>(endpoint, token, id, data);
    } catch (error: any) {
      console.error(`Error updating ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to delete an entity
   * @param endpoint OData endpoint path
   * @param id Entity ID
   * @param token Auth token
   * @returns Promise that resolves when deletion is complete
   */
  async delete(endpoint: string, id: string, token: string): Promise<void> {
    if (!token) {
      throw new Error('No auth token provided');
    }

    if (!id) {
      throw new Error(`No ID provided for ${endpoint} delete`);
    }

    try {
      await this.odataService.delete(endpoint, token, id);
    } catch (error: any) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const sharedApiService = new SharedApiService();
