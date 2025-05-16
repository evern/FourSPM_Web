import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Permission, RolePermission } from '../../types/permission-types';
import { baseApiService } from '../../api/base-api.service';
import notify from 'devextreme/ui/notify';

/**
 * OData endpoint for permissions
 */
const PERMISSIONS_ENDPOINT = 'Permissions';
const ROLE_PERMISSIONS_ENDPOINT = 'RolePermissions';

/**
 * Fetch all available permissions
 */
const fetchPermissions = async (): Promise<Permission[]> => {
  const response = await baseApiService.request(PERMISSIONS_ENDPOINT);
  const data = await response.json();
  return data.value || [];
};

/**
 * Fetch permissions for a specific role
 */
const fetchRolePermissions = async (roleId: string): Promise<RolePermission[]> => {
  const response = await baseApiService.request(`${ROLE_PERMISSIONS_ENDPOINT}?$filter=roleId eq '${roleId}'`);
  const data = await response.json();
  return data.value || [];
};

/**
 * Result interface for the permission data provider hook
 */
export interface PermissionDataProviderResult {
  permissions: Permission[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  getRolePermissions: (roleId: string) => Promise<Permission[]>;
  assignPermissionsToRole: (roleId: string, permissionIds: string[]) => Promise<void>;
}

/**
 * Data provider hook for permission management
 * @returns Object containing permissions and operations for permission management
 */
export const usePermissionDataProvider = (): PermissionDataProviderResult => {
  const queryClient = useQueryClient();

  // Query for fetching all permissions
  const { 
    data: permissions = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions
  });
  
  const error = queryError as Error | null;
  
  // Function to get permissions for a specific role
  const getRolePermissions = async (roleId: string): Promise<Permission[]> => {
    try {
      const rolePermissions = await fetchRolePermissions(roleId);
      const permissionIds = rolePermissions.map(rp => rp.permissionId);
      
      // Filter the permissions to only include those assigned to the role
      return permissions.filter(permission => permissionIds.includes(permission.id));
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  };
  
  // Mutation for assigning permissions to a role
  const assignPermissionsMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string, permissionIds: string[] }): Promise<void> => {
      // First, delete existing role permissions
      await baseApiService.request(`${ROLE_PERMISSIONS_ENDPOINT}/RemoveAllForRole/${roleId}`, {
        method: 'POST'
      });
      
      // Then, add new role permissions
      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map(permissionId => ({
          roleId,
          permissionId
        }));
        
        await baseApiService.request(ROLE_PERMISSIONS_ENDPOINT, {
          method: 'POST',
          body: JSON.stringify(rolePermissions)
        });
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      queryClient.invalidateQueries({ queryKey: ['rolePermissions', variables.roleId] });
      
      notify({
        message: `Permissions updated successfully for role`,
        type: 'success',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
    },
    onError: (error: Error) => {
      notify({
        message: `Failed to update permissions: ${error.message}`,
        type: 'error',
        displayTime: 5000,
        position: { at: 'top center', my: 'top center' }
      });
    }
  });
  
  // Function to assign permissions to a role
  const assignPermissionsToRole = async (roleId: string, permissionIds: string[]): Promise<void> => {
    return assignPermissionsMutation.mutateAsync({ roleId, permissionIds });
  };
  
  return {
    permissions,
    isLoading,
    error,
    refetch,
    getRolePermissions,
    assignPermissionsToRole
  };
};
