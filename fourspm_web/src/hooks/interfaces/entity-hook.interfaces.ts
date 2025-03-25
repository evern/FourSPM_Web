import { HookCallbacks } from './shared.hook.interfaces';
import { Form } from 'devextreme-react/form';

/**
 * Entity state interface - represents the state of an entity in an EntityHook
 */
export interface EntityState<T> {
  data: T | null;
  isLoading: boolean;
  isDirty: boolean; 
  error: string | null;
  originalData: T | null;
}

/**
 * Interface for related entity operations
 * This allows for loading related entities and updating the main entity with that data
 */
export interface EntityRelatedOperation<T, R> {
  /**
   * Gets the ID of the related entity from the main entity
   */
  getRelatedId: (entity: T) => string | null;
  
  /**
   * Loads the related entity data
   */
  loadRelated: (relatedId: string, token: string) => Promise<R | null>;
  
  /**
   * Updates the main entity with the related entity data
   */
  updateEntity: (entity: T, relatedData: R) => T;
}

/**
 * Entity hook configuration interface
 */
export interface EntityHookConfig<T> {
  /**
   * Services for CRUD operations
   */
  services: {
    /**
     * Get entity by ID
     */
    getById?: (id: string, token: string) => Promise<T>;
    
    /**
     * Create a new entity
     */
    create?: (data: Partial<T>, token: string) => Promise<T>;
    
    /**
     * Update an existing entity
     */
    update?: (id: string, data: Partial<T>, token: string) => Promise<T>;
    
    /**
     * Delete an entity
     */
    delete?: (id: string, token: string) => Promise<void>;
  };
  
  /**
   * Optional callbacks for different CRUD operations
   */
  callbacks?: {
    /**
     * Called when an entity is successfully loaded
     */
    onLoadSuccess?: (result: T) => void;
    
    /**
     * Called when an entity is successfully created
     */
    onCreateSuccess?: (result: T) => void;
    
    /**
     * Called when an entity is successfully updated
     */
    onUpdateSuccess?: (result: T) => void;
    
    /**
     * Called when an entity is successfully deleted
     */
    onDeleteSuccess?: (id: string) => void;
    
    /**
     * Called when an error occurs during any operation
     */
    onError?: (error: Error, operation: string) => void;
  };
  
  /**
   * Optional ID to automatically load when the hook is initialized
   */
  autoLoadId?: string;
}

/**
 * Entity hook interface - provides methods for managing entity data
 */
export interface EntityHook<T> {
  /**
   * Entity state
   */
  entity: EntityState<T>;
  
  /**
   * Clear entity state
   */
  clearEntity: () => void;
  
  /**
   * Load entity by ID
   */
  loadEntity: (id: string) => Promise<T | null>;

  /**
   * Load entity with enhanced details and error handling
   */
  loadEntityWithDetails?: (id: string) => Promise<T | null>;
  
  /**
   * Create a new entity
   */
  createEntity: (data: Partial<T>) => Promise<T | null>;
  
  /**
   * Update an existing entity
   */
  updateEntity: (id: string, data: Partial<T>) => Promise<T | null>;
  
  /**
   * Delete an entity
   */
  deleteEntity: (id: string) => Promise<boolean>;
  
  /**
   * Save entity changes
   */
  saveEntity: (currentData: T) => Promise<T | null>;
  
  /**
   * Set the form reference
   */
  onFormRef: (ref: Form) => void;
  
  /**
   * Start editing mode
   */
  startUpdate: () => void;
  
  /**
   * Cancel editing mode
   */
  cancelUpdate: () => void;
  
  /**
   * Whether the entity is currently being edited
   */
  isUpdating: boolean;
  
  /**
   * Whether the entity is currently being saved
   */
  isSaving: boolean;

  /**
   * Load related entity data and update the main entity
   */
  loadRelatedEntity?: <R>(relatedOperation: EntityRelatedOperation<T, R>) => Promise<T | null>;

  /**
   * Callbacks configured for this hook
   */
  callbacks?: EntityHookConfig<T>['callbacks'];
}
