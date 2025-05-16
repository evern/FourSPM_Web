/**
 * Role permission data provider hook
 * Follows the established FourSPM pattern for data provider hooks with React Query
 * Integrates with the centralized API service for consistent data access
 */
import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { RolePermission } from '../../adapters/role.adapter';
import { ROLE_PERMISSIONS_ENDPOINT } from '../../config/api-endpoints';
import { useODataStore } from '../../stores/odataStores';
import { roleService } from '../../services/role.service';

// Query keys for React Query cache management
export const RolePermissionKeys = {
  all: ['rolePermissions'] as const,
  lists: () => [...RolePermissionKeys.all, 'list'] as const,
  list: (roleId?: string) => [...RolePermissionKeys.lists(), { roleId }] as const,
  details: () => [...RolePermissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...RolePermissionKeys.details(), id] as const,
};

// Define the type for permission query results
interface PermissionsQueryResult {
  permissions: RolePermission[];
  totalCount: number;
}

/**
 * Custom hook for providing role permission data throughout the application
 * @param roleId Optional role GUID to filter permissions by role
 * @returns Object containing role permissions data, store, loading state, error state, and refetch function
 */
export const useRolePermissionDataProvider = (roleId?: string) => {
  const queryClient = useQueryClient();
  
  // Create OData store for role permissions using the centralized endpoint constant
  const rolePermissionsStore = useODataStore(ROLE_PERMISSIONS_ENDPOINT, 'GUID', {
    keyType: 'String',
    fieldTypes: {
      CREATED: 'Date',
      MODIFIED: 'Date',
    },
  });

  // Fetch role permissions data using React Query and the centralized RoleService
  const {
    data: permissionsData,
    isLoading,
    error,
    refetch,
  } = useQuery<PermissionsQueryResult>({
    queryKey: RolePermissionKeys.list(roleId),
    queryFn: async () => {
      // Use the centralized roleService for data fetching
      const response = roleId 
        ? await roleService.getRolePermissions(roleId)
        : await roleService.getAllRoles(); // Fallback if no roleId provided
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch role permissions');
      }
      
      return {
        permissions: (response.data || []) as RolePermission[],
        totalCount: response.data?.length || 0,
      };
    },
    enabled: true, // Always enabled, but will use different service method based on roleId
  });

  // Create a memoized DataSource for DevExtreme components
  const permissionsDataSource = useMemo(() => {
    // Create a static lookup function to avoid TypeScript errors
    const getPermissionData = () => ({
      data: permissionsData?.permissions || [] as RolePermission[],
      totalCount: permissionsData?.totalCount || 0
    });
    
    const store = new CustomStore({
      key: 'guid',
      load: async (options: any) => {
        try {
          // First check if we already have data
          if (permissionsData) {
            return getPermissionData();
          }
          
          // If no data, trigger a fetch and return empty data
          // This pattern aligns with the standard FourSPM approach
          await refetch();
          return getPermissionData();
        } catch (error) {
          console.error('Error loading permissions:', error);
          return {
            data: [] as RolePermission[],
            totalCount: 0
          };
        }
      }
    });

    return new DataSource({
      store,
    });
  }, [permissionsData, refetch]);

  // Function to invalidate permissions cache after mutations
  const invalidatePermissions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RolePermissionKeys.all });
  }, [queryClient]);

  // Function to invalidate permissions for a specific role
  const invalidateRolePermissions = useCallback((roleId: string) => {
    queryClient.invalidateQueries({ queryKey: RolePermissionKeys.list(roleId) });
  }, [queryClient]);

  // Use proper destructuring with defaults to ensure type safety
  const permissions = permissionsData ? permissionsData.permissions : [];
  const totalCount = permissionsData ? permissionsData.totalCount : 0;
  
  return {
    data: permissions,
    totalCount,
    store: rolePermissionsStore,
    dataSource: permissionsDataSource,
    isLoading,
    error,
    refetch,
    invalidatePermissions,
    invalidateRolePermissions,
  };
};
