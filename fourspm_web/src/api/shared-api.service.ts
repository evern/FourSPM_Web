import { ODataService, ODataResponse } from './odata.service';
import { useMSALAuth } from '../contexts/msal-auth';
import { PublicClientApplication } from '@azure/msal-browser';

/**
 * SharedApiService provides reusable API methods for common operations
 * across multiple domain services
 */
class SharedApiService {
  private odataService: ODataService;
  private msalInstance?: PublicClientApplication;

  constructor(msalInstance?: PublicClientApplication) {
    this.msalInstance = msalInstance;
    this.odataService = new ODataService(msalInstance);
  }

  /**
   * Generic method to perform a direct GET request to an API endpoint
   * @param url Full endpoint URL including query parameters
   * @returns Promise resolving to the API response
   */
  async get<T>(url: string): Promise<T> {
    try {
      const response = await this.odataService.get<T>(url);
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
   * @param query Optional query string (e.g. $expand=Related)
   * @returns Promise resolving to the entity
   */
  async getById<T>(endpoint: string, id: string, query?: string): Promise<T> {
    if (!id) {
      throw new Error(`No ID provided for ${endpoint}`);
    }

    try {
      const queryParam = query ? `?${query}` : '';
      const response = await this.odataService.get<T>(`${endpoint}(${id})${queryParam}`);
      return response as unknown as T;
    } catch (error: any) {
      console.error(`Error fetching ${endpoint} by ID:`, error);
      throw error;
    }
  }

  /**
   * Generic method to get all entities from an endpoint
   * @param endpoint OData endpoint path
   * @param query Optional query string
   * @returns Promise resolving to array of entities
   */
  async getAll<T>(endpoint: string, query?: string): Promise<T[]> {
    try {
      // Construct full URL with query parameters if provided
      const url = query ? `${endpoint}?${query}` : endpoint;
      const response = await this.odataService.get<T>(url);
      return response.value || [];
    } catch (error: any) {
      console.error(`Error fetching all ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to create or update an entity with POST
   * @param endpoint OData endpoint path
   * @param data Data to send
   * @returns Promise resolving to the created/updated entity
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      return this.odataService.post<T>(endpoint, data);
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
   * @returns Promise that resolves when update is complete
   */
  async update<T>(endpoint: string, id: string, data: Partial<T>): Promise<void> {
    if (!id) {
      throw new Error(`No ID provided for ${endpoint} update`);
    }

    try {
      await this.odataService.patch<T>(endpoint, id, data);
    } catch (error: any) {
      console.error(`Error updating ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to delete an entity
   * @param endpoint OData endpoint path
   * @param id Entity ID
   * @returns Promise that resolves when deletion is complete
   */
  async delete(endpoint: string, id: string): Promise<void> {
    if (!id) {
      throw new Error(`No ID provided for ${endpoint} delete`);
    }

    try {
      await this.odataService.delete(endpoint, id);
    } catch (error: any) {
      console.error(`Error deleting ${endpoint}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const sharedApiService = new SharedApiService();
