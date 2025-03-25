import { FilterOptions, HookCallbacks } from './shared.hook.interfaces';
import { Properties } from 'devextreme/ui/data_grid';
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
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
  onUpdateSuccess?: () => void;
  onUpdateError?: (error: Error) => void;
  onInsertSuccess?: () => void;
  onInsertError?: (error: Error) => void;
}

/**
 * Hook interface for collection operations
 */
export interface CollectionHook<T> {
  // Collection state and operations
  collection: CollectionState<T>;
  loadItems: (options?: FilterOptions) => Promise<T[] | null>;
  refreshCollection: () => Promise<T[] | null>;
  isCollectionLoading: boolean;
  setFilterOptions: (options: FilterOptions) => void;
  filterOptions: FilterOptions | null;
  
  // Grid operations handlers
  handleRowUpdating?: (e: any) => void;
  handleRowRemoving?: (e: any) => void;
  handleRowInserting?: (e: any) => void;
  onRowValidating?: (e: any) => void;
}

/**
 * Enhanced CollectionHook that guarantees grid operation handlers
 * This provides non-optional (required) grid operation handlers
 */
export interface GridEnabledCollectionHook<T> extends CollectionHook<T> {
  // Required grid operation handlers
  handleRowUpdating: (e: any) => void;
  handleRowRemoving: (e: any) => void;
  handleRowInserting: (e: any) => void;
  onRowValidating: (e: any) => void;
}

/**
 * Standard interface for project-aware controllers
 * Provides common project-related functionality and grid instance management
 */
export interface ProjectControllerBase<T> {
  // Grid initialization and row management
  handleInitNewRow: (e: any) => void;
  handleGridInitialized: (e: any) => void;
  
  // Project data
  project: Project | null;
  gridInstance: any;
  setGridInstance: (instance: any) => void;
}

/**
 * Configuration for collection hook services
 */
export interface CollectionServices<T> {
  getAll: (options?: FilterOptions, token?: string) => Promise<T[]>;
}

/**
 * Configuration for creating a collection hook
 */
export interface CollectionHookConfig<T> {
  services: CollectionServices<T>;
  callbacks?: HookCallbacks<T>;
  initialFilter?: FilterOptions;
  validationRules?: ValidationRule[];
}
