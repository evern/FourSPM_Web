import ODataStore from 'devextreme/data/odata/store';

/**
 * Types for the permissions feature
 * Following the standard pattern for types in the application
 */

/**
 * Permission level enum for determining access level
 */
export enum PermissionLevel {
  NONE = 'NONE',
  READ_ONLY = 'READ_ONLY',
  FULL_ACCESS = 'FULL_ACCESS'
}

/**
 * Permission type enum to distinguish between access level and toggle permissions
 */
export enum PermissionType {
  AccessLevel = 'AccessLevel',
  Toggle = 'Toggle'
}

/**
 * StaticPermission interface defining the structure of permissions from the backend
 */
export interface StaticPermission {
  featureKey: string;    // Unique feature identifier (e.g., "deliverables")
  displayName: string;   // User-friendly display name (e.g., "Deliverables")
  description: string;   // Detailed description of the feature
  featureGroup: string;  // Grouping category (e.g., "Project Management")
}

/**
 * RolePermission interface matching the RolePermissionEntity in the backend
 */
export interface RolePermission {
  guid: string;        // Primary key
  roleGuid: string;    // Foreign key to Role
  permission: string;  // Name of the permission (e.g., "deliverables.view" or "deliverables.edit")
  
  // Audit fields
  created?: Date;
  createdBy?: string;
  updated?: Date;
  updatedBy?: string;
  deleted?: Date;
  deletedBy?: string;
}

/**
 * FeaturePermission interface for grouping a feature's read and edit permissions
 */
export interface FeaturePermission {
  featureKey: string;           // Unique feature identifier (e.g., "deliverables")
  displayName: string;          // User-friendly display name (e.g., "Deliverables")
  description: string;          // Detailed description of the feature
  featureGroup: string;         // Grouping category (e.g., "Project Management")
  viewPermission: string;       // The permission string for view access (e.g., "deliverables.view")
  editPermission: string;       // The permission string for edit access (e.g., "deliverables.edit")
}

/**
 * PermissionAssignment interface for tracking a feature's permission level
 */
export interface PermissionAssignment {
  featureKey: string;         // Unique feature identifier (e.g., "deliverables")
  permissionLevel: PermissionLevel;  // Current permission level
  viewPermissionGuid?: string;      // GUID of the view permission record (if assigned)
  editPermissionGuid?: string;      // GUID of the edit permission record (if assigned)
}

/**
 * Role interface for displaying role information
 */
export interface Role {
  guid: string;
  name: string;
  displayName: string;
  description?: string;
  isSystemRole: boolean;
}

/**
 * State for the permissions context
 */
export interface PermissionsState {
  loading: boolean;
  error: string | null;
  staticPermissions: StaticPermission[];
  rolePermissions: RolePermission[];
  permissionAssignments: PermissionAssignment[];
  role?: Role;
  roleGuid?: string;
}

/**
 * Action types for the permissions reducer
 */
export type PermissionsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STATIC_PERMISSIONS'; payload: StaticPermission[] }
  | { type: 'SET_ROLE_PERMISSIONS'; payload: RolePermission[] }
  | { type: 'SET_PERMISSION_ASSIGNMENTS'; payload: PermissionAssignment[] }
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'SET_ROLE_GUID'; payload: string }
  | { type: 'TOGGLE_PERMISSION'; payload: { featureKey: string; level: PermissionLevel; permissionGuid?: string } };

/**
 * Provider props interface for the PermissionsProvider component
 */
export interface PermissionsProviderProps {
  children: React.ReactNode;
  roleId?: string;
}

/**
 * Context props interface for the permissions context
 */
export interface PermissionsContextProps {
  // State
  state: PermissionsState;
  
  // State management functions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Permissions management functions
  fetchStaticPermissions: () => Promise<StaticPermission[]>;
  fetchRolePermissions: (roleId: string) => Promise<RolePermission[]>;
  setPermissionLevel: (featureKey: string, level: PermissionLevel) => Promise<void>;
  
  // Utility functions
  getPermissionLevel: (featureKey: string) => PermissionLevel;
  buildPermissionAssignments: (staticPermissions: StaticPermission[], rolePermissions: RolePermission[]) => PermissionAssignment[];
  getRole: (roleId: string) => Promise<Role | null>;
  
  // Permission button action handlers
  setAccessLevel: (featureKey: string, action: string) => Promise<boolean>; // 'NoAccess', 'ReadOnly', 'FullAccess'
  setToggleState: (featureKey: string, enabled: boolean) => Promise<boolean>; // true/false
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}
