import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Role, RoleCreateParams, RoleUpdateParams } from '../../types/role-types';
import { rolesStore, checkRoleNameExists, validateRoleModification } from '../../api/roles-api.service';
import { baseApiService } from '../../api/base-api.service';
import notify from 'devextreme/ui/notify';

/**
 * OData endpoint for roles
 */
const ROLES_ENDPOINT = 'Roles';

/**
 * Fetch roles data from the API
 * @returns Promise with array of roles
 */
const fetchRoles = async (): Promise<Role[]> => {
  const response = await baseApiService.request(ROLES_ENDPOINT);
  const data = await response.json();
  return data.value || [];
};

/**
 * Result interface for the role data provider hook
 */
export interface RoleDataProviderResult {
  roles: Role[];
  rolesStore: typeof rolesStore;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  createRole: (role: RoleCreateParams) => Promise<Role>;
  updateRole: (role: RoleUpdateParams) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
}

/**
 * Data provider hook for role data
 * @returns Object containing the roles store, data array, loading state, and CRUD operations
 */
export const useRoleDataProvider = (): RoleDataProviderResult => {
  const queryClient = useQueryClient();

  // Use React Query to fetch and cache roles
  const { 
    data: roles = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles
  });
  
  const error = queryError as Error | null;

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (role: RoleCreateParams): Promise<Role> => {
      // Check if role with same name already exists
      const exists = await checkRoleNameExists(role.name);
      if (exists) {
        throw new Error(`A role with the name "${role.name}" already exists.`);
      }

      // Create the role
      const result = await rolesStore.insert({
        ...role,
        isSystemRole: false,
        permissions: role.permissions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return result as Role;
    },
    onSuccess: () => {
      // Invalidate roles query to refetch
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notify({
        message: 'Role created successfully',
        type: 'success',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
    },
    onError: (error: Error) => {
      notify({
        message: `Failed to create role: ${error.message}`,
        type: 'error',
        displayTime: 5000,
        position: { at: 'top center', my: 'top center' }
      });
      throw error;
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (role: RoleUpdateParams): Promise<Role> => {
      // Get existing role to validate
      const existingRole = await rolesStore.byKey(role.id) as Role;
      
      // Validate role modification
      const validation = validateRoleModification(existingRole);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // Check if name changed and new name exists
      if (role.name && role.name !== existingRole.name) {
        const exists = await checkRoleNameExists(role.name, role.id);
        if (exists) {
          throw new Error(`A role with the name "${role.name}" already exists.`);
        }
      }

      // Update the role
      const { id, ...updateData } = role;
      const result = await rolesStore.update(id, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });

      return result as Role;
    },
    onSuccess: () => {
      // Invalidate roles query to refetch
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notify({
        message: 'Role updated successfully',
        type: 'success',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
    },
    onError: (error: Error) => {
      notify({
        message: `Failed to update role: ${error.message}`,
        type: 'error',
        displayTime: 5000,
        position: { at: 'top center', my: 'top center' }
      });
      throw error;
    }
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // Get existing role to validate
      const existingRole = await rolesStore.byKey(id) as Role;
      
      // Validate role modification
      const validation = validateRoleModification(existingRole);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      await rolesStore.remove(id);
    },
    onSuccess: () => {
      // Invalidate roles query to refetch
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      notify({
        message: 'Role deleted successfully',
        type: 'success',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' }
      });
    },
    onError: (error: Error) => {
      notify({
        message: `Failed to delete role: ${error.message}`,
        type: 'error',
        displayTime: 5000,
        position: { at: 'top center', my: 'top center' }
      });
      throw error;
    }
  });

  return {
    roles,
    rolesStore,
    isLoading,
    error,
    refetch,
    createRole: createRoleMutation.mutateAsync,
    updateRole: updateRoleMutation.mutateAsync,
    deleteRole: deleteRoleMutation.mutateAsync
  };
};
