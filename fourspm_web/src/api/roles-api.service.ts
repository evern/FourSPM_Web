/**
 * API Service for role management operations
 */
import { Role, RoleCreateParams, RoleUpdateParams } from '../types/role-types';
import ODataStore from 'devextreme/data/odata/store';
import { getODataPath } from './base-api.service';

/**
 * OData endpoint for roles
 */
const ROLES_ENDPOINT = 'Roles';

/**
 * OData store configuration for roles
 */
export const rolesStore = new ODataStore({
  url: getODataPath(ROLES_ENDPOINT),
  key: 'id',
  version: 4,
  deserializeDates: true,
  fieldTypes: {
    id: 'String',
    name: 'String',
    description: 'String',
    permissions: 'Array',
    isSystemRole: 'Boolean',
    createdAt: 'Date',
    updatedAt: 'Date'
  }
});

/**
 * Role modification validation
 * @param role Role to validate
 * @returns Validation result with error message if invalid
 */
export const validateRoleModification = (role: Role): { isValid: boolean; message?: string } => {
  // System roles cannot be modified or deleted
  if (role.isSystemRole) {
    return {
      isValid: false,
      message: 'System roles cannot be modified or deleted.'
    };
  }
  
  // Name validation
  if (!role.name || role.name.trim().length < 3) {
    return {
      isValid: false,
      message: 'Role name must be at least 3 characters long.'
    };
  }
  
  return { isValid: true };
};

/**
 * Check if a role with the given name already exists
 * @param name Role name to check
 * @param excludeId Optional ID to exclude from the check (for updates)
 * @returns Promise resolving to true if role exists, false otherwise
 */
export const checkRoleNameExists = async (name: string, excludeId?: string): Promise<boolean> => {
  try {
    const filter = excludeId
      ? [['name', '=', name], 'and', ['id', '<>', excludeId]]
      : ['name', '=', name];
    
    const result = await rolesStore.load({
      filter,
      take: 1
    });
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking role name:', error);
    return false; // Assume it doesn't exist on error
  }
};
