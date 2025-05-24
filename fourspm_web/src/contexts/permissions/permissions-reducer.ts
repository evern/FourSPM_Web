import { PermissionsState, PermissionsAction, PermissionLevel } from './permissions-types';

/**
 * Initial state for the permissions context
 */
export const initialPermissionsState: PermissionsState = {
  loading: false,
  error: null,
  staticPermissions: [],
  rolePermissions: [],
  permissionAssignments: []
};

/**
 * Reducer function for the permissions context
 * Handles state updates based on dispatched actions
 */
export function permissionsReducer(state: PermissionsState, action: PermissionsAction): PermissionsState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
      
    case 'SET_STATIC_PERMISSIONS':
      return {
        ...state,
        staticPermissions: action.payload
      };
      
    case 'SET_ROLE_PERMISSIONS':
      return {
        ...state,
        rolePermissions: action.payload
      };
      
    case 'SET_PERMISSION_ASSIGNMENTS':
      return {
        ...state,
        permissionAssignments: action.payload
      };
      
    case 'SET_ROLE':
      return {
        ...state,
        role: action.payload
      };
      
    case 'SET_ROLE_GUID':
      return {
        ...state,
        roleGuid: action.payload
      };
      
    case 'TOGGLE_PERMISSION': {
      // Find the existing permission assignment
      const { featureKey, level, permissionGuid } = action.payload;
      const assignments = [...state.permissionAssignments];
      const assignmentIndex = assignments.findIndex(a => a.featureKey === featureKey);
      
      if (assignmentIndex === -1) {
        // This should not happen if the assignments are properly initialized
        return state;
      }
      
      // Update the assignment with the new permission level and GUID if provided
      const assignment = { ...assignments[assignmentIndex] };
      
      // Handle permission level changes with appropriate GUID updates
      if (level === PermissionLevel.READ_ONLY) {
        assignment.permissionLevel = PermissionLevel.READ_ONLY;
        assignment.viewPermissionGuid = permissionGuid;
        assignment.editPermissionGuid = undefined;
      } else if (level === PermissionLevel.FULL_ACCESS) {
        assignment.permissionLevel = PermissionLevel.FULL_ACCESS;
        assignment.viewPermissionGuid = undefined;
        assignment.editPermissionGuid = permissionGuid;
      } else {
        // NONE - clear both permissions
        assignment.permissionLevel = PermissionLevel.NONE;
        assignment.viewPermissionGuid = undefined;
        assignment.editPermissionGuid = undefined;
      }
      
      assignments[assignmentIndex] = assignment;
      
      return {
        ...state,
        permissionAssignments: assignments
      };
    }
      
    default:
      return state;
  }
}
