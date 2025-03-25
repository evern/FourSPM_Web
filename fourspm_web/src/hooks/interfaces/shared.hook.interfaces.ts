/**
 * Shared interfaces for data hooks
 */

// Options for filtering, paging, sorting
export interface FilterOptions {
  filter?: Record<string, any>;
  sort?: string | string[]; 
  skip?: number;
  take?: number;
  projectId?: string;
  [key: string]: any;
}

// Callback functions for hook operations
export interface HookCallbacks<T> {
  // Generic operation callbacks
  onSuccess?: (data: T[] | T, operation: string) => void;
  onError?: (error: Error, operation: string) => void;
  
  // Specific operation callbacks
  onLoadSuccess?: (data: T[] | T) => void;
  onCreateSuccess?: (data: T) => void;
  onUpdateSuccess?: (data?: T) => void;
  onDeleteSuccess?: (id?: string) => void;
  
  // Grid-specific callbacks
  onInsertSuccess?: () => void;
  onInsertError?: (error: Error) => void;
  onUpdateError?: (error: Error) => void;
  onDeleteError?: (error: Error) => void;
  
  // Grid configuration
  endpoint?: string;
}

// Type to represent basic entity with ID
export type Entity = {
  guid: string;
  [key: string]: any;
};
