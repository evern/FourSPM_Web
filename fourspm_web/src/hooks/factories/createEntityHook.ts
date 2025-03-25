/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useCallback, useMemo, useEffect } from 'react';
import notify from 'devextreme/ui/notify';
import { Form } from 'devextreme-react/form';
import { 
  EntityState, 
  EntityHook, 
  EntityHookConfig,
  EntityRelatedOperation
} from '../interfaces/entity-hook.interfaces';

/**
 * Creates a custom hook for managing single entity data operations
 * 
 * This function should be called within React function components or custom hooks.
 * It returns an implementation of EntityHook<T> with state and operations for the entity.
 * 
 * @param config Configuration for the hook
 * @param token Authentication token
 * @returns Object with entity state and operations
 */
export function createEntityHook<T>(
  config: EntityHookConfig<T>,
  token?: string
): EntityHook<T> {
  const initialState: EntityState<T> = {
    data: null,
    isLoading: false,
    isDirty: false,
    error: null,
    originalData: null
  };
  
  // Use useState hook for entity state
  const [entity, setEntity] = useState<EntityState<T>>(initialState);
  
  // Form-related state
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formRef, setFormRef] = useState<Form | null>(null);
  
  /**
   * Clear entity state
   */
  const clearEntity = useCallback(() => {
    setEntity(initialState);
  }, []);
  
  /**
   * Load entity by ID
   */
  const loadEntity = useCallback(async (id: string): Promise<T | null> => {
    if (!token || !config.services.getById) return null;
    
    setEntity(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await config.services.getById(id, token);
      
      setEntity({
        data: result,
        isLoading: false,
        isDirty: false,
        error: null,
        originalData: null
      });
      
      if (config.callbacks?.onLoadSuccess) {
        config.callbacks.onLoadSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setEntity(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      notify(`Error loading entity: ${errorMessage}`, 'error', 3000);
      
      if (config.callbacks?.onError) {
        config.callbacks.onError(error instanceof Error ? error : new Error(String(error)), 'loadEntity');
      }
      
      return null;
    }
  }, [token, config.services.getById]);

  /**
   * Load entity with details - enhanced version of loadEntity that provides more detailed loading state management
   * This is useful for components that need to show loading indicators or handle loading errors explicitly
   */
  const loadEntityWithDetails = useCallback(async (id: string): Promise<T | null> => {
    if (!token || !config.services.getById) return null;
    
    try {
      // Leverage the standard loadEntity function
      const data = await loadEntity(id);
      
      // If the entity was loaded successfully, return it
      if (data) {
        return data;
      }
      return null;
    } catch (error) {
      setEntity(prev => ({
        ...prev,
        error: `Error loading entity data: ${error}`
      }));
      return null;
    }
  }, [token, loadEntity]);
  
  /**
   * Create new entity
   */
  const createEntity = useCallback(async (data: Partial<T>): Promise<T | null> => {
    if (!token || !config.services.create) return null;
    
    setEntity(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await config.services.create(data, token);
      
      setEntity({
        data: result,
        isLoading: false,
        isDirty: false,
        error: null,
        originalData: null
      });
      
      notify('Created successfully', 'success', 2000);
      
      if (config.callbacks?.onCreateSuccess) {
        config.callbacks.onCreateSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setEntity(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      notify(`Error creating entity: ${errorMessage}`, 'error', 3000);
      
      if (config.callbacks?.onError) {
        config.callbacks.onError(error instanceof Error ? error : new Error(String(error)), 'createEntity');
      }
      
      return null;
    }
  }, [token, config.services.create]);

  /**
   * Load related entity data and update the main entity
   * This can be used to load related entities (e.g., client details for a project)
   */
  const loadRelatedEntity = useCallback(async <R>(
    relatedOperation: EntityRelatedOperation<T, R>
  ): Promise<T | null> => {
    if (!entity.data || !token) return null;
    
    try {
      // Get the ID for the related entity from the current entity data
      const relatedId = relatedOperation.getRelatedId(entity.data);
      if (!relatedId) return entity.data;
      
      // Load the related entity data
      const relatedData = await relatedOperation.loadRelated(relatedId, token);
      if (!relatedData) return entity.data;
      
      // Update the main entity with the related data
      const updatedEntity = relatedOperation.updateEntity(entity.data, relatedData);
      
      // Update the entity state
      setEntity(prev => ({
        ...prev,
        data: updatedEntity,
        isDirty: true
      }));
      
      return updatedEntity;
    } catch (error) {
      notify(`Error loading related data: ${error}`, 'error', 3000);
      return entity.data;
    }
  }, [entity.data, token]);
  
  /**
   * Update entity by ID
   */
  const updateEntity = useCallback(async (id: string, data: Partial<T>): Promise<T | null> => {
    if (!token || !config.services.update) return null;
    
    setEntity(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await config.services.update(id, data, token);
      
      setEntity({
        data: result,
        isLoading: false,
        isDirty: false,
        error: null,
        originalData: null
      });
      
      notify('Updated successfully', 'success', 2000);
      
      if (config.callbacks?.onUpdateSuccess) {
        config.callbacks.onUpdateSuccess(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setEntity(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      notify(`Error updating entity: ${errorMessage}`, 'error', 3000);
      
      if (config.callbacks?.onError) {
        config.callbacks.onError(error instanceof Error ? error : new Error(String(error)), 'updateEntity');
      }
      
      return null;
    }
  }, [token, config.services.update]);
  
  /**
   * Delete entity by ID
   */
  const deleteEntity = useCallback(async (id: string): Promise<boolean> => {
    if (!token || !config.services.delete) return false;
    
    setEntity(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await config.services.delete(id, token);
      
      setEntity(initialState);
      notify('Deleted successfully', 'success', 2000);
      
      if (config.callbacks?.onDeleteSuccess) {
        config.callbacks.onDeleteSuccess(id);
      }
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setEntity(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      
      notify(`Error deleting entity: ${errorMessage}`, 'error', 3000);
      
      if (config.callbacks?.onError) {
        config.callbacks.onError(error instanceof Error ? error : new Error(String(error)), 'deleteEntity');
      }
      
      return false;
    }
  }, [token, config.services.delete]);
  
  /**
   * Set the form reference for accessing form data
   */
  const onFormRef = useCallback((ref: Form) => {
    setFormRef(ref);
  }, []);
  
  /**
   * Start updating mode
   */
  const startUpdate = useCallback(() => {
    // Store the original data for potential cancel operation
    const originalData = entity.data ? { ...entity.data } : null;
    setEntity(prev => ({
      ...prev,
      originalData // Store original data in entity state
    }));
    setIsUpdating(true);
  }, [entity.data]);
  
  /**
   * Cancel updating mode
   */
  const cancelUpdate = useCallback(() => {
    // Restore the original data if it exists
    if (entity.originalData) {
      setEntity(prev => ({
        ...prev,
        data: entity.originalData as T, // Cast to avoid undefined type error
        originalData: null // Clear the stored original
      }));
    }
    setIsUpdating(false);
  }, [entity.originalData]);
  
  /**
   * Save entity changes from form
   * @param currentData Current entity data
   * @returns Updated entity data if successful, null otherwise
   */
  const saveEntity = useCallback(async (currentData: T): Promise<T | null> => {
    if (!currentData) return null;
    
    // Assuming the entity has an 'id' or 'guid' property
    const entityId = (currentData as any).id || (currentData as any).guid;
    if (!entityId) {
      notify('Entity ID not found', 'error', 3000);
      return null;
    }
    
    setIsSaving(true);
    try {
      // Validate form if we have a reference
      if (formRef && formRef.instance) {
        const isValid = formRef.instance.validate().isValid;
        if (!isValid) {
          notify('Please correct the validation errors', 'error', 3000);
          return null;
        }
      }
      
      // Get the latest form data if available, otherwise use currentData
      const dataToSave = formRef?.instance ? 
        formRef.instance.option('formData') : currentData;
      
      // Use the updateEntity from the hook
      const result = await updateEntity(entityId, dataToSave);
      
      if (result) {
        setIsUpdating(false); // Exit edit mode on successful save
        setEntity(prev => ({
          ...prev,
          originalData: null // Clear stored original
        }));
        notify('Saved successfully', 'success', 3000);
        return result;
      }
      return null;
    } catch (error) {
      notify(`Error saving: ${error}`, 'error', 3000);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [updateEntity, formRef]);

  /**
   * Auto-load an entity by ID when the hook is used
   * This is useful for components that need to immediately load an entity when mounted
   */
  useEffect(() => {
    // Skip loading if no autoLoadId, token or getById service
    if (!config.autoLoadId || !token || !config.services.getById) {
      return;
    }
    
    // Skip if we already have data for this entity or we're currently loading
    if (entity.data || entity.isLoading) {
      return;
    }
    
    // Load the entity since we have a valid configuration and no existing data
    loadEntity(config.autoLoadId);
  }, [config.autoLoadId, token, config.services.getById, loadEntity, entity.data, entity.isLoading]);
  
  /**
   * Return the hook implementation
   */
  return {
    entity,
    clearEntity,
    loadEntity,
    loadEntityWithDetails,
    createEntity,
    updateEntity,
    deleteEntity,
    onFormRef,
    startUpdate,
    cancelUpdate,
    isUpdating,
    isSaving,
    saveEntity,
    loadRelatedEntity,
    callbacks: config.callbacks || {}
  };
}
