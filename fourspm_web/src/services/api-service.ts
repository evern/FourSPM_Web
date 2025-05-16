/**
 * API Service
 * Centralized module for managing API endpoint calls
 * following the FourSPM UI Development Guidelines
 */
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getApiEndpoint, getODataEndpoint } from '../config/api';
import { Environment, CURRENT_ENVIRONMENT } from '../config/environment';
import { getStoredToken } from '../api/auth-token.service';

// Standard API response interface
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  success: boolean;
}

// API error response interface for type safety in error handling
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  [key: string]: any; // For any other properties the API might return
}

// Configure axios defaults
const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
});

// Configure request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add environment-specific headers
    if (CURRENT_ENVIRONMENT !== Environment.PRODUCTION) {
      config.headers['X-Environment'] = CURRENT_ENVIRONMENT;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * API Service class for centralized API requests
 */
export class ApiService {
  /**
   * Make a GET request to a standard API endpoint
   */
  static async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    try {
      const config: AxiosRequestConfig = {};
      if (params) {
        config.params = params;
      }
      
      const response: AxiosResponse = await apiClient.get(endpoint, config);
      return {
        data: response.data,
        status: response.status,
        success: true
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }
  
  /**
   * Make a POST request to a standard API endpoint
   */
  static async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await apiClient.post(endpoint, data);
      return {
        data: response.data,
        status: response.status,
        success: true
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }
  
  /**
   * Make a PUT request to a standard API endpoint
   */
  static async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await apiClient.put(endpoint, data);
      return {
        data: response.data,
        status: response.status,
        success: true
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }
  
  /**
   * Make a DELETE request to a standard API endpoint
   */
  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse = await apiClient.delete(endpoint);
      return {
        data: response.data,
        status: response.status,
        success: true
      };
    } catch (error) {
      return this.handleError<T>(error as AxiosError);
    }
  }
  
  /**
   * Handle API errors in a consistent way
   */
  private static handleError<T>(error: AxiosError): ApiResponse<T> {
    const status = error.response?.status || 500;
    const errorData = error.response?.data as ApiErrorResponse;
    const errorMessage = errorData?.message || errorData?.error || error.message || 'Unknown error';
    
    // Log errors in development and staging, but not in production
    if (CURRENT_ENVIRONMENT !== Environment.PRODUCTION) {
      console.error(`API Error (${status}):`, errorMessage, error);
    }
    
    return {
      error: errorMessage,
      status,
      success: false
    };
  }
}

/**
 * Auth API Service specialized for authentication-related endpoints
 */
export class AuthApiService {
  /**
   * Sign in user
   */
  static async signIn(email: string, password: string, azureToken?: string): Promise<ApiResponse<any>> {
    const loginEndpoint = getApiEndpoint('/auth/login');
    return ApiService.post(loginEndpoint, { email, password, azureToken });
  }
  
  /**
   * Sign out user
   */
  static async signOut(): Promise<ApiResponse<any>> {
    const logoutEndpoint = getApiEndpoint('/auth/logout');
    return ApiService.post(logoutEndpoint);
  }
  
  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<ApiResponse<any>> {
    const userEndpoint = getApiEndpoint('/auth/me');
    return ApiService.get(userEndpoint);
  }
}

/**
 * OData API Service specialized for OData operations
 */
export class ODataApiService {
  /**
   * Get OData entities with filtering
   */
  static async getEntities<T>(entityType: string, params?: any): Promise<ApiResponse<T>> {
    const endpoint = getODataEndpoint(entityType);
    return ApiService.get<T>(endpoint, params);
  }
  
  /**
   * Get OData entity by ID
   */
  static async getEntityById<T>(entityType: string, id: string): Promise<ApiResponse<T>> {
    const endpoint = `${getODataEndpoint(entityType)}(${id})`;
    return ApiService.get<T>(endpoint);
  }
  
  /**
   * Create OData entity
   */
  static async createEntity<T>(entityType: string, data: any): Promise<ApiResponse<T>> {
    const endpoint = getODataEndpoint(entityType);
    return ApiService.post<T>(endpoint, data);
  }
  
  /**
   * Update OData entity
   */
  static async updateEntity<T>(entityType: string, id: string, data: any): Promise<ApiResponse<T>> {
    const endpoint = `${getODataEndpoint(entityType)}(${id})`;
    return ApiService.put<T>(endpoint, data);
  }
  
  /**
   * Delete OData entity
   */
  static async deleteEntity<T>(entityType: string, id: string): Promise<ApiResponse<T>> {
    const endpoint = `${getODataEndpoint(entityType)}(${id})`;
    return ApiService.delete<T>(endpoint);
  }
}

/**
 * Role API Service specialized for role management
 */
export class RoleApiService {
  /**
   * Get all roles
   */
  static async getRoles(): Promise<ApiResponse<any>> {
    return ODataApiService.getEntities('Roles');
  }
  
  /**
   * Get role by ID
   */
  static async getRoleById(id: string): Promise<ApiResponse<any>> {
    return ODataApiService.getEntityById('Roles', id);
  }
  
  /**
   * Create new role
   */
  static async createRole(roleData: any): Promise<ApiResponse<any>> {
    return ODataApiService.createEntity('Roles', roleData);
  }
  
  /**
   * Update role
   */
  static async updateRole(id: string, roleData: any): Promise<ApiResponse<any>> {
    return ODataApiService.updateEntity('Roles', id, roleData);
  }
  
  /**
   * Delete role
   */
  static async deleteRole(id: string): Promise<ApiResponse<any>> {
    return ODataApiService.deleteEntity('Roles', id);
  }
  
  /**
   * Get role permissions
   */
  static async getRolePermissions(roleId: string): Promise<ApiResponse<any>> {
    const endpoint = getODataEndpoint(`RolePermissions?$filter=ROLE_ID eq ${roleId}`);
    return ApiService.get(endpoint);
  }
  
  /**
   * Assign permission to role
   */
  static async assignPermission(roleId: string, permissionData: any): Promise<ApiResponse<any>> {
    return ODataApiService.createEntity('RolePermissions', {
      ...permissionData,
      ROLE_ID: roleId
    });
  }
  
  /**
   * Remove permission from role
   */
  static async removePermission(permissionId: string): Promise<ApiResponse<any>> {
    return ODataApiService.deleteEntity('RolePermissions', permissionId);
  }
  
  /**
   * Get user roles based on token
   * For Azure AD integration
   */
  static async getUserRoles(token: string): Promise<ApiResponse<any>> {
    try {
      // First, try to get roles from the user endpoint
      const userEndpoint = getApiEndpoint('/auth/me');
      
      // Create a custom config to use the provided token explicitly
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Call the API directly instead of using ApiService to use the custom config
      const response = await apiClient.get(userEndpoint, config);
      
      // If the user has a roles property, return it
      if (response.data && response.data.roles) {
        return {
          data: response.data.roles,
          status: response.status,
          success: true
        };
      }
      
      // If no roles found in user data, return empty array with success
      return {
        data: [],
        status: response.status,
        success: true
      };
    } catch (error) {
      // In case of error, log it but return empty roles array with success
      // This prevents authentication from failing completely if roles can't be fetched
      console.error('Error fetching user roles:', error);
      return {
        data: [],
        status: 200, // Return 200 to prevent auth failure
        success: true
      };
    }
  }
}
