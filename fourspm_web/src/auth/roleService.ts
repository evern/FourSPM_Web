/**
 * Role Service
 * Provides methods for role and permission management
 * Following the FourSPM UI Development Guidelines
 */
import { ApiResponse } from '../services/api-service';
import { Role, RolePermission } from '../adapters/role.adapter';
import { ROLES_ENDPOINT, ROLE_PERMISSIONS_ENDPOINT } from '../config/api-endpoints';
import axios from 'axios';

/**
 * Service class for role-related operations
 */
class RoleService {
  /**
   * Get all roles
   * @returns Promise with ApiResponse containing Role array
   */
  async getAllRoles(): Promise<ApiResponse<Role[]>> {
    try {
      const response = await axios.get(ROLES_ENDPOINT);
      return {
        data: response.data,
        status: response.status,
        success: true
      };
    } catch (error: any) {
      return this.handleError<Role[]>(error);
    }
  }

  /**
   * Get permissions for a specific role
   * @param roleId The role GUID
   * @returns Promise with ApiResponse containing RolePermission array
   */
  async getRolePermissions(roleId: string): Promise<ApiResponse<RolePermission[]>> {
    try {
      const endpoint = `${ROLE_PERMISSIONS_ENDPOINT}?$filter=roleId eq ${roleId}`;
      const response = await axios.get(endpoint);
      return {
        data: response.data,
        status: response.status,
        success: true
      };
    } catch (error: any) {
      return this.handleError<RolePermission[]>(error);
    }
  }

  /**
   * Handle API errors consistently
   * @param error The error from axios
   * @returns ApiResponse with error details
   */
  private handleError<T>(error: any): ApiResponse<T> {
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    
    // Log errors in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      console.error(`API Error (${status}):`, errorMessage, error);
    }
    
    return {
      error: errorMessage,
      status,
      success: false
    };
  }
}

// Create singleton instance
export const roleService = new RoleService();
