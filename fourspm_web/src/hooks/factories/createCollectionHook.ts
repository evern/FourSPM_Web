/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useCallback, useMemo } from 'react';
import notify from 'devextreme/ui/notify';
import { FilterOptions } from '../interfaces/shared.hook.interfaces';
import { Properties } from 'devextreme/ui/data_grid';
import { 
  CollectionState, 
  CollectionHook,
  GridEnabledCollectionHook,
  CollectionHookConfig,
  ValidationRule
} from '../interfaces/collection-hook.interfaces';

/**
 * Creates a custom hook for managing collection data operations with integrated grid functionality
 * 
 * This function should be called within React function components or custom hooks.
 * It returns an implementation of CollectionHook<T> or GridEnabledCollectionHook<T> with state and operations.
 * 
 * @param config Configuration for the hook
 * @param token Authentication token
 * @param gridEnabled If true, returns a GridEnabledCollectionHook with guaranteed grid handlers
 * @returns Object with collection state and grid-enabled operations
 */
export function createCollectionHook<T>(
  config: CollectionHookConfig<T>,
  token?: string,
  gridEnabled: boolean = false
): CollectionHook<T> | GridEnabledCollectionHook<T> {
  const initialState: CollectionState<T> = {
    items: [],
    isLoading: false,
    error: null,
    totalCount: 0,
    lastRefreshed: undefined
  };
  
  // Use useState hook
  const [collection, setCollection] = useState<CollectionState<T>>(initialState);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(config.initialFilter || null);
  
  /**
   * Load collection of items with optional filter options
   */
  const loadItems = useCallback(async (options?: FilterOptions): Promise<T[] | null> => {
    if (!token || !config.services.getAll) return null;
    
    const mergedOptions = options ? { ...filterOptions, ...options } : filterOptions || undefined;
    setCollection(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await config.services.getAll(mergedOptions, token);
      
      // Handle OData responses with count
      let totalCount = result.length;
      if (Array.isArray(result) && 'totalCount' in result) {
        // Check for lowercase @odata.count or Count property
        totalCount = (result as any).totalCount || (result as any)['@odata.count'] || result.length;
      }

      setCollection({
        items: result,
        isLoading: false,
        error: null,
        totalCount,
        lastRefreshed: new Date()
      });

      if (config.callbacks?.onSuccess) {
        config.callbacks.onSuccess(result, 'read');
      }

      return result;
    } catch (error) {
      console.error('Error loading items:', error);
      setCollection(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error)
      }));

      if (config.callbacks?.onError) {
        config.callbacks.onError(error instanceof Error ? error : new Error(String(error)), 'read');
      }

      return null;
    }
  }, [token, filterOptions, config]);

  /**
   * Refresh the collection with current filter options
   */
  const refreshCollection = useCallback(async (): Promise<T[] | null> => {
    return await loadItems(filterOptions || undefined);
  }, [loadItems, filterOptions]);

  /**
   * Computed property to check if collection is loading
   */
  const isCollectionLoading = useMemo(() => collection.isLoading, [collection.isLoading]);

  /**
   * Handler for row updating event in DataGrid
   */
  const handleRowUpdating: Properties['onRowUpdating'] = useCallback(async (e) => {
    // Always provide an implementation for gridEnabled mode, even if just a no-op
    if (!token || !config.callbacks) {
      if (gridEnabled) {
        console.warn('Row updating attempted but token or callbacks are missing');
        e.cancel = true;
      }
      return;
    }
    
    try {
      // Make a copy of the original data for error handling
      const oldData = { ...e.oldData };
      // Merge oldData with newData to handle partial updates
      const updatedData = { ...oldData, ...e.newData };

      // Let the grid handle the update operation directly for OData
      e.cancel = false;

      // Call the onUpdateSuccess callback if defined
      if (config.callbacks?.onUpdateSuccess) {
        // We'll call this after the grid completes the operation
        e.data = config.callbacks.onUpdateSuccess;
      }
      
      // Add error handler that will be called if the grid's update operation fails
      e.error = (error: any) => {
        console.error('Error updating row:', error);
        if (config.callbacks?.onUpdateError) {
          config.callbacks.onUpdateError(error instanceof Error ? error : new Error(String(error)));
        }
        notify(`Update failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
      };
    } catch (error) {
      console.error('Error in handleRowUpdating:', error);
      if (config.callbacks?.onUpdateError) {
        config.callbacks.onUpdateError(error instanceof Error ? error : new Error(String(error)));
      }
      notify(`Update failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
      return null;
    }
  }, [token, config, refreshCollection]);

  /**
   * Handler for row removing event in DataGrid
   */
  const handleRowRemoving: Properties['onRowRemoving'] = useCallback(async (e) => {
    // Always provide an implementation for gridEnabled mode, even if just a no-op
    if (!token || !config.callbacks) {
      if (gridEnabled) {
        console.warn('Row removing attempted but token or callbacks are missing');
        e.cancel = true;
      }
      return;
    }
    
    try {
      // Let the grid handle the delete operation directly for OData
      e.cancel = false;
      
      // Call the onDeleteSuccess callback if defined
      if (config.callbacks?.onDeleteSuccess) {
        // We'll call this after the grid completes the operation
        e.data = config.callbacks.onDeleteSuccess;
      }
      
      // Add error handler that will be called if the grid's delete operation fails
      e.error = (error: any) => {
        console.error('Error removing row:', error);
        if (config.callbacks?.onDeleteError) {
          config.callbacks.onDeleteError(error instanceof Error ? error : new Error(String(error)));
        }
        notify(`Delete failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
      };
    } catch (error) {
      console.error('Error in handleRowRemoving:', error);
      if (config.callbacks?.onDeleteError) {
        config.callbacks.onDeleteError(error instanceof Error ? error : new Error(String(error)));
      }
      notify(`Delete failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
      return null;
    }
  }, [token, config, refreshCollection]);

  /**
   * Handler for row inserting event in DataGrid
   */
  const handleRowInserting: Properties['onRowInserting'] = useCallback(async (e) => {
    // Debug logging
    console.log('Row inserting triggered with data:', e.data);
    console.log('Endpoint used:', config.callbacks?.endpoint);
    console.log('Token available:', !!token);
    
    // Always provide an implementation for gridEnabled mode, even if just a no-op
    if (!token || !config.callbacks) {
      if (gridEnabled) {
        console.warn('Row inserting attempted but token or callbacks are missing');
        e.cancel = true;
      }
      return;
    }

    try {
      // Let the grid handle the insert operation directly for OData
      e.cancel = false;

      // More debug logging
      const originalData = { ...e.data };
      console.log('Original row data before success callback:', originalData);

      // Call the onInsertSuccess callback if defined
      if (config.callbacks?.onInsertSuccess) {
        // Store the callback to be called after the operation completes
        // DO NOT replace e.data with the callback!
        const successCallback = config.callbacks.onInsertSuccess;
        
        // We need to make the callback available for after the operation
        // but NOT replace the actual data
        e.success = () => {
          console.log('Insert operation succeeded, calling success callback');
          successCallback();
        };
      }
      
      // Add error handler that will be called if the grid's insert operation fails
      e.error = (error: any) => {
        console.error('Error inserting row:', error);
        console.error('Error details:', error.response?.data || error.message);
        if (config.callbacks?.onInsertError) {
          config.callbacks.onInsertError(error instanceof Error ? error : new Error(String(error)));
        }
        notify(`Insert failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
      };
    } catch (error) {
      console.error('Error in handleRowInserting:', error);
      if (config.callbacks?.onInsertError) {
        config.callbacks.onInsertError(error instanceof Error ? error : new Error(String(error)));
      }
      notify(`Insert failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
      return null;
    }
  }, [token, config, refreshCollection]);

  /**
   * Function generator for row validation
   * @param additionalRules Additional validation rules to apply on top of the default ones
   * @returns Validation function for the grid
   */
  const handleRowValidating = useCallback((additionalRules: ValidationRule[] = []) => {
    // Combine default validation rules with any additional ones
    const allRules = [...(config.validationRules || []), ...additionalRules];
    
    // Return a function that will validate the row
    return (e: any) => {
      // Check if there are any validation rules defined
      if (!allRules.length) return;
      
      // Validate data against rules
      for (const rule of allRules) {
        // Get the field value from newData if available, otherwise from oldData
        const value = e.newData[rule.field] !== undefined ? 
          e.newData[rule.field] : 
          (e.oldData ? e.oldData[rule.field] : undefined);
        
        // Check if field is required
        if (rule.required && (value === undefined || value === null || value === '')) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} is required`;
          return;
        }

        if (value && rule.pattern && !rule.pattern.test(value.toString())) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} format is invalid`;
          return;
        }

        if (rule.maxLength && value && value.toString().length > rule.maxLength) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be at most ${rule.maxLength} characters`;
          return;
        }
        
        // Check min and max values for numeric fields
        if (value !== undefined && value !== null) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            if (rule.min !== undefined && numValue < rule.min) {
              e.isValid = false;
              e.errorText = rule.errorText || `${rule.field} must be at least ${rule.min}`;
              return;
            }
            
            if (rule.max !== undefined && numValue > rule.max) {
              e.isValid = false;
              e.errorText = rule.errorText || `${rule.field} must be at most ${rule.max}`;
              return;
            }
          }
        }
      }
    };
  }, [config.validationRules]);
  
  // Create a ready-to-use validation function with default validation rules
  const onRowValidating = useMemo(() => {
    return handleRowValidating([]);
  }, [handleRowValidating]);
  
  // Define the hook based on whether we want a GridEnabledCollectionHook or regular CollectionHook
  const hookResult = {
    // Collection state and operations
    collection,
    loadItems,
    refreshCollection,
    isCollectionLoading,
    setFilterOptions,
    filterOptions: filterOptions || null,
    
    // Grid operations directly integrated
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleRowValidating,
    onRowValidating
  };
  
  // Return the appropriate type based on the gridEnabled flag
  if (gridEnabled) {
    return hookResult as GridEnabledCollectionHook<T>;
  } else {
    return hookResult as CollectionHook<T>;
  }
}
