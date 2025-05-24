import { ReactNode } from 'react';

/**
 * Interface for editor preparation event
 */
export interface EditorEvent {
  editorName?: string;
  editorOptions: any;
  dataField?: string;
  row?: {
    data: any;
    isNewRow: boolean;
  };
  component?: any;
  cancel?: boolean;
}

/**
 * Interface for new row initialization event
 */
export interface InitNewRowEvent {
  data: any;
  component?: any;
}

/**
 * Role interface matching RoleEntity properties from the backend
 */
export interface Role {
  guid: string;
  name: string;
  displayName: string;
  description?: string;
  isSystemRole: boolean;
  
  // Audit fields
  created: Date;
  createdBy: string;
  updated?: Date;
  updatedBy?: string;
  deleted?: Date;
  deletedBy?: string;
}

/**
 * Interface for the roles state managed by the reducer
 */
export interface RolesState {
  loading: boolean;
  error: string | null;
  editorError: string | null;
  processing: boolean;
}

/**
 * Role action types for the reducer
 */
export type RolesAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EDITOR_ERROR'; payload: string | null }
  | { type: 'SET_PROCESSING'; payload: boolean };

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Interface for the roles context
 */
export interface RolesContextType {
  // State
  state: RolesState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Validation methods
  validateRole: (role: Record<string, any>) => ValidationResult;
  handleRowValidating: (e: any) => void;
  validateRowUpdating: (oldData: Record<string, any>, newData: Record<string, any>) => ValidationResult;
  
  // Editor functions
  getDefaultRoleValues: () => Partial<Role>;
  handleRoleEditorPreparing: (e: EditorEvent) => void;
  handleRoleInitNewRow: (e: InitNewRowEvent) => void;
  
  // Cache invalidation function
  invalidateAllLookups: () => void;
}

/**
 * Props for the RolesProvider component
 */
export interface RolesProviderProps {
  children: ReactNode;
}
