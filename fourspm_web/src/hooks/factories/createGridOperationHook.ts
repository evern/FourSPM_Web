/* eslint-disable react-hooks/rules-of-hooks */
import { useCallback } from 'react';
import notify from 'devextreme/ui/notify';
import { 
  GridOperationsHook,
  GridOperationsConfig,
  ValidationRule
} from '../interfaces/grid-operation-hook.interfaces';

/**
 * Creates a custom hook for managing collection data operations with integrated grid functionality
 * 
 * This function should be called within React function components or custom hooks.
 * It returns an implementation of CollectionHook<T> with grid operations.
 * 
 * @param config Configuration for the hook
 * @param token Authentication token
 * @param gridEnabled If true, returns a hook with guaranteed grid handlers
 * @returns Object with grid-enabled operations
 */
export function createGridOperationHook<T>(
  config: GridOperationsConfig,
  token?: string
): GridOperationsHook<T> {
  /**
   * Row updating event handler for grid
   */
  const handleRowUpdating = useCallback((e: any) => {
    // Extract values from the event
    const { oldData, newData, component } = e;
    
    // Skip update processing if it's a batch edit
    if (component?.option('editing.mode') === 'batch') {
      return;
    }
    
    try {
      // Call component's onRowUpdating callback if available
      if (component?._options?.onRowUpdating) {
        component._options.onRowUpdating(e);
      }
      
      // Execute configuration callbacks
      if (config.onUpdateSuccess) {
        config.onUpdateSuccess();
      }
    } catch (error) {
      // Handle errors
      e.cancel = true;
      if (config.onUpdateError) {
        config.onUpdateError(error instanceof Error ? error : new Error(String(error)));
      }
      notify(`Update failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
    }
  }, [token, config]);
  
  /**
   * Row removing event handler for grid
   */
  const handleRowRemoving = useCallback((e: any) => {
    // Extract values from the event
    const { data, component } = e;
    
    // Skip delete processing if it's a batch edit
    if (component?.option('editing.mode') === 'batch') {
      return;
    }
    
    try {
      // Call component's onRowRemoving callback if available
      if (component?._options?.onRowRemoving) {
        component._options.onRowRemoving(e);
      }
      
      // Execute configuration callbacks
      if (config.onDeleteSuccess) {
        config.onDeleteSuccess();
      }
    } catch (error) {
      // Handle errors
      e.cancel = true;
      if (config.onDeleteError) {
        config.onDeleteError(error instanceof Error ? error : new Error(String(error)));
      }
      notify(`Delete failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
    }
  }, [token, config]);
  
  /**
   * Row inserting event handler for grid
   */
  const handleRowInserting = useCallback((e: any) => {
    // Extract values from the event
    const { data, component } = e;
    
    // Skip insert processing if it's a batch edit
    if (component?.option('editing.mode') === 'batch') {
      return;
    }
    
    try {
      // Call component's onRowInserting callback if available
      if (component?._options?.onRowInserting) {
        component._options.onRowInserting(e);
      }
      
      // Execute configuration callbacks
      if (config.onInsertSuccess) {
        config.onInsertSuccess();
      }
    } catch (error) {
      // Handle errors
      e.cancel = true;
      if (config.onInsertError) {
        config.onInsertError(error instanceof Error ? error : new Error(String(error)));
      }
      notify(`Insert failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 3000);
    }
  }, [token, config]);
  
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
        
        // Check for max length constraint
        if (value && rule.maxLength && value.toString().length > rule.maxLength) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be less than ${rule.maxLength} characters`;
          return;
        }
        
        // Check for min length constraint
        if (value && rule.minLength && value.toString().length < rule.minLength) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be at least ${rule.minLength} characters`;
          return;
        }
        
        // Check for min value constraint (for numbers)
        if (value !== undefined && rule.min !== undefined && parseFloat(value.toString()) < rule.min) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be at least ${rule.min}`;
          return;
        }
        
        // Check for max value constraint (for numbers)
        if (value !== undefined && rule.max !== undefined && parseFloat(value.toString()) > rule.max) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be at most ${rule.max}`;
          return;
        }
      }
    };
  }, [config.validationRules]);
  
  // Generate onRowValidating handler using the rules
  const onRowValidating = handleRowValidating();

  // Return the hook with all grid operations handlers
  return {
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating: onRowValidating,
    // Backward compatibility properties (will be deprecated in future)
    collection: { items: [] },
    isCollectionLoading: false,
    refreshCollection: async () => { console.warn('refreshCollection is deprecated and will be removed in a future version.'); }
  } as GridOperationsHook<T>;
}
