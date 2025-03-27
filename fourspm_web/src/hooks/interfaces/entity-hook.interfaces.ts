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
   * Callbacks for CRUD operations
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
   * ID to automatically load when the hook is initialized
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
   * Load related entity data and update the main entity
   */
  loadRelatedEntity?: <R>(relatedOperation: EntityRelatedOperation<T, R>) => Promise<T | null>;

  /**
   * Silently update entity data without triggering loading state
   * This is useful for updating the entity after a form save operation
   * without causing the UI to flicker with loading indicators
   */
  silentlyUpdateEntity?: (data: T) => void;

  /**
   * Callbacks configured for this hook
   */
  callbacks?: EntityHookConfig<T>['callbacks'];
}
