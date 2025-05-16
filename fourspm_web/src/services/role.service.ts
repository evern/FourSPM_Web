/**
 * Role Service
 * Provides methods for role and permission management
 * Following the FourSPM UI Development Guidelines
 */
import { ApiResponse, RoleApiService } from './api-service';
import { Role, RolePermission } from '../adapters/role.adapter';

/**
 * Service class for role-related operations
 */
export class RoleService {
  /**
   * Get all roles
   * @returns Promise with ApiResponse containing Role array
   */
  async getAllRoles(): Promise<ApiResponse<Role[]>> {
    return RoleApiService.getRoles();
  }

  /**
   * Get role by ID
   * @param roleId The role GUID
   * @returns Promise with ApiResponse containing Role
   */
  async getRoleById(roleId: string): Promise<ApiResponse<Role>> {
    return RoleApiService.getRoleById(roleId);
  }

  /**
   * Get permissions for a specific role
   * @param roleId The role GUID
   * @returns Promise with ApiResponse containing RolePermission array
   */
  async getRolePermissions(roleId: string): Promise<ApiResponse<RolePermission[]>> {
    return RoleApiService.getRolePermissions(roleId);
  }

  /**
   * Create a new role
   * @param roleData The role data
   * @returns Promise with ApiResponse containing the created Role
   */
  async createRole(roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    return RoleApiService.createRole(roleData);
  }

  /**
   * Update a role
   * @param roleId The role GUID
   * @param roleData The updated role data
   * @returns Promise with ApiResponse containing the updated Role
   */
  async updateRole(roleId: string, roleData: Partial<Role>): Promise<ApiResponse<Role>> {
    return RoleApiService.updateRole(roleId, roleData);
  }

  /**
   * Delete a role
   * @param roleId The role GUID
   * @returns Promise with ApiResponse
   */
  async deleteRole(roleId: string): Promise<ApiResponse<void>> {
    return RoleApiService.deleteRole(roleId);
  }

  /**
   * Assign a permission to a role
   * @param roleId The role GUID
   * @param permissionName The permission name
   * @returns Promise with ApiResponse containing the created RolePermission
   */
  async assignPermission(roleId: string, permissionName: string): Promise<ApiResponse<RolePermission>> {
    const permissionData = {
      roleGuid: roleId,
      permissionName
    };
    return RoleApiService.assignPermission(roleId, permissionData);
  }

  /**
   * Remove a permission from a role
   * @param permissionId The permission GUID
   * @returns Promise with ApiResponse
   */
  async removePermission(permissionId: string): Promise<ApiResponse<void>> {
    return RoleApiService.removePermission(permissionId);
  }

  /**
   * Get roles for the current user based on their token
   * @param token The access token from Azure AD
   * @returns Promise with array of roles
   */
  async getUserRoles(token: string): Promise<Role[]> {
    try {
      // For Azure AD integration, we need to get user roles 
      // Try to get from API first
      const response = await RoleApiService.getUserRoles(token);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      // If API call fails or returns no data, fall back to getting all roles
      // This is temporary until the backend API is fully implemented
      const allRolesResponse = await this.getAllRoles();
      if (allRolesResponse.success && allRolesResponse.data) {
        // For now, assume the user has the first role (usually user role)
        // In production, this should come from the token claims or API
        return allRolesResponse.data.slice(0, 1);
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }
  }
}

// Create singleton instance
export const roleService = new RoleService();
