/**
 * Role data provider hook
 * Follows the established FourSPM pattern for data provider hooks using React Query
 * Integrates with the centralized API service for consistent data access
 */
import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { Role, roleAdapter } from '../../adapters/role.adapter';
import { ROLES_ENDPOINT } from '../../config/api-endpoints';
import { useODataStore } from '../../stores/odataStores';
import { roleService } from '../../services/role.service';

// Query keys for React Query cache management
export const RoleKeys = {
  all: ['roles'] as const,
  lists: () => [...RoleKeys.all, 'list'] as const,
  list: (filters: string) => [...RoleKeys.lists(), { filters }] as const,
  details: () => [...RoleKeys.all, 'detail'] as const,
  detail: (id: string) => [...RoleKeys.details(), id] as const,
};

// Define the type for role query results
interface RolesQueryResult {
  roles: Role[];
  totalCount: number;
}

/**
 * Custom hook for providing role data throughout the application
 * Uses the centralized RoleService for consistent API access
 * @returns Object containing roles data, store, loading state, error state, and refetch function
 */
export const useRoleDataProvider = () => {
  const queryClient = useQueryClient();
  
  // Create OData store for roles using the centralized endpoint constant
  const rolesStore = useODataStore(ROLES_ENDPOINT, 'GUID', {
    keyType: 'String',
    fieldTypes: {
      IS_SYSTEM_ROLE: 'Boolean',
      CREATED: 'Date',
      MODIFIED: 'Date',
    },
  });

  // Fetch roles data using React Query and the centralized RoleService
  const {
    data: rolesData,
    isLoading,
    error,
    refetch,
  } = useQuery<RolesQueryResult>({
    queryKey: RoleKeys.lists(),
    queryFn: async () => {
      // Use the centralized roleService for data fetching
      const response = await roleService.getAllRoles();
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch roles');
      }
      
      return {
        roles: (response.data || []) as Role[],
        totalCount: response.data?.length || 0,
      };
    },
  });

  // Create a memoized DataSource for DevExtreme components following the FourSPM pattern
  const rolesDataSource = useMemo(() => {
    // Create a static lookup function to avoid TypeScript errors
    const getRoleData = () => ({
      data: rolesData?.roles || [] as Role[],
      totalCount: rolesData?.totalCount || 0
    });
    
    const store = new CustomStore({
      key: 'guid',
      load: async (options: any) => {
        try {
          // First check if we already have data
          if (rolesData) {
            return getRoleData();
          }
          
          // If no data, trigger a fetch and return empty data
          // This pattern aligns with the standard FourSPM approach
          await refetch();
          return getRoleData();
        } catch (error) {
          console.error('Error loading roles:', error);
          return {
            data: [] as Role[],
            totalCount: 0
          };
        }
      }
    });

    return new DataSource({
      store,
    });
  }, [rolesData, refetch]);

  // Function to invalidate roles cache after mutations - used for CRUD operations
  const invalidateRoles = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RoleKeys.all });
  }, [queryClient]);

  // Use proper destructuring with defaults to ensure type safety
  const roles = rolesData ? rolesData.roles : [];
  const totalCount = rolesData ? rolesData.totalCount : 0;
  
  return {
    data: roles,
    totalCount,
    store: rolesStore,
    dataSource: rolesDataSource,
    isLoading,
    error,
    refetch,
    invalidateRoles,
  };
};
