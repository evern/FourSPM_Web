import { Project } from '../../types/index';

/**
 * State of a collection
 */
export interface CollectionState<T> {
  items: T[];
  isLoading: boolean;
  error: string | null;
  totalCount?: number;
  lastRefreshed?: Date;
}

/**
 * Validation rule for grid validation
 */
export interface ValidationRule {
  field: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  errorText?: string;
}

/**
 * Configuration for grid operations
 */
export interface GridOperationsConfig {
  endpoint?: string;
  validationRules?: ValidationRule[];
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
  onUpdateSuccess?: () => void;
  onUpdateError?: (error: Error) => void;
  onInsertSuccess?: () => void;
  onInsertError?: (error: Error) => void;
  
  /**
   * Optional function to invalidate React Query caches after successful operations
   * This allows triggering cache refreshes for related data when entity data changes
   */
  invalidateCache?: () => void;
  
  /**
   * Optional default values to apply to new rows
   * These will be applied after the automatic UUID generation
   */
  defaultValues?: Record<string, any>;
}

/**
 * Enhanced CollectionHook that guarantees grid operation handlers
 * This provides non-optional (required) grid operation handlers
 * These handlers are used by ODataGrid components to manage CRUD operations
 */
export interface GridOperationsHook<T> {
  // Grid operations handlers
  
  // Handles row update operations triggered by the grid's editing functionality
  // Processes changes when a user edits an existing row and confirms the changes
  handleRowUpdating: (e: any) => void;
  
  // Handles row delete operations triggered when a user tries to delete a row
  // Typically calls an API delete endpoint with the appropriate item ID
  handleRowRemoving: (e: any) => void;
  
  // Handles row insertion operations when a user adds a new row
  // Typically calls an API create endpoint with the new item data
  handleRowInserting: (e: any) => void;
  
  // Validates row data before saving to ensure data integrity
  // Uses the validation rules configured in the controller
  handleRowValidating: (e: any) => void;
  
  // Initializes a new row with default values
  // Automatically adds a new UUID and any entity-specific default values
  handleInitNewRow: (e: any) => void;
}

/**
 * Standard interface for project-aware controllers
 * Provides common project-related functionality and grid instance management
 */
export interface ProjectScopedGridController<T> {
  // Grid initialization and row management
  handleInitNewRow: (e: any) => void;
  handleGridInitialized: (e: any) => void;
  // Project data
  project: Project | null;
  isProjectLoading: boolean;
}
