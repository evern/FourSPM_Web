/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import notify from 'devextreme/ui/notify';
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
  // Create initialState with useMemo to prevent recreation on every render
  const initialState = useMemo<EntityState<T>>(() => ({
    data: null,
    isLoading: false,
    isDirty: false,
    error: null,
    originalData: null
  }), []);
  
  // Use useState hook for entity state
  const [entity, setEntity] = useState<EntityState<T>>(initialState);
  
  /**
   * Clear entity state
   */
  const clearEntity = useCallback(() => {
    setEntity(initialState);
  }, [initialState]);
  
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
      setEntity(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
      
      if (config.callbacks?.onError && error instanceof Error) {
        config.callbacks.onError(error, 'loadEntity');
      }
      
      notify(`Error loading: ${error}`, 'error', 3000);
      return null;
    }
  }, [token, config.callbacks, config.services]);
  
  /**
   * Create a new entity
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
      
      if (config.callbacks?.onCreateSuccess) {
        config.callbacks.onCreateSuccess(result);
      }
      
      notify('Created successfully', 'success', 3000);
      return result;
    } catch (error) {
      setEntity(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : String(error) 
      }));
      
      if (config.callbacks?.onError && error instanceof Error) {
        config.callbacks.onError(error, 'createEntity');
      }
      
      notify(`Error creating: ${error}`, 'error', 3000);
      return null;
    }
  }, [token, config.callbacks, config.services]);
  
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
      
      if (config.callbacks?.onUpdateSuccess) {
        config.callbacks.onUpdateSuccess(result);
      }
      
      return result;
    } catch (error) {
      setEntity(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
      
      if (config.callbacks?.onError && error instanceof Error) {
        config.callbacks.onError(error, 'updateEntity');
      }
      
      notify(`Error updating: ${error}`, 'error', 3000);
      return null;
    }
  }, [token, config.callbacks, config.services]);
  
  /**
   * Delete entity by ID
   */
  const deleteEntity = useCallback(async (id: string): Promise<boolean> => {
    if (!token || !config.services.delete) return false;
    
    setEntity(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await config.services.delete(id, token);
      
      clearEntity();
      
      if (config.callbacks?.onDeleteSuccess) {
        config.callbacks.onDeleteSuccess(id);
      }
      
      notify('Deleted successfully', 'success', 3000);
      return true;
    } catch (error) {
      setEntity(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error)
      }));
      
      if (config.callbacks?.onError && error instanceof Error) {
        config.callbacks.onError(error, 'deleteEntity');
      }
      
      notify(`Error deleting: ${error}`, 'error', 3000);
      return false;
    }
  }, [token, config.callbacks, config.services, clearEntity]);
  
  /**
   * Load related entity data and update the main entity
   */
  const loadRelatedEntity = useCallback(async <R>(
    relatedOperation: EntityRelatedOperation<T, R>
  ): Promise<T | null> => {
    if (!entity.data || !token) return null;
    
    const relatedId = relatedOperation.getRelatedId(entity.data);
    if (!relatedId) return entity.data;
    
    try {
      setEntity(prev => ({ ...prev, isLoading: true }));
      
      const relatedData = await relatedOperation.loadRelated(relatedId, token);
      
      if (relatedData && entity.data) {
        // Update entity with related data
        const updatedEntity = relatedOperation.updateEntity(entity.data, relatedData);
        
        // Update state with the new entity data
        setEntity(prev => ({
          ...prev,
          data: updatedEntity,
          isLoading: false
        }));
        
        return updatedEntity;
      }
      
      return entity.data;
      
    } catch (error) {
      notify(`Error loading related data: ${error}`, 'error', 3000);
      setEntity(prev => ({ ...prev, isLoading: false }));
      return entity.data;
    }
  }, [entity.data, token, setEntity]);
  
  /**
   * Silently update entity data without triggering loading state
   * This is useful for updating the entity after a form save operation
   * without causing the UI to flicker with loading indicators
   */
  const silentlyUpdateEntity = useCallback((data: T): void => {
    if (!data) return;
    
    setEntity(prev => ({
      ...prev,
      data,
      isDirty: false,
      originalData: null
    }));
  }, []);

  /**
   * Auto-load an entity by ID when the hook is used
   * This is useful for components that need to immediately load an entity when mounted
   */
  const loadEntityRef = useRef(loadEntity);
  loadEntityRef.current = loadEntity;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (config.autoLoadId && token) {
      loadEntityRef.current(config.autoLoadId);
    }
  }, [config.autoLoadId, token]);
  
  return {
    entity,
    clearEntity,
    loadEntity,
    createEntity,
    updateEntity,
    deleteEntity,
    loadRelatedEntity,
    silentlyUpdateEntity,
    callbacks: config.callbacks || {}
  };
}
