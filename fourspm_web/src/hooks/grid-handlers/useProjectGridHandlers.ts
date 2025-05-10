import { useCallback } from 'react';
import { useProjects } from '../../contexts/projects/projects-context';
import { ValidationRule } from '../interfaces/grid-operation-hook.interfaces';

/**
 * Interface for project grid validation handlers
 */
export interface ProjectGridValidationHandlers {
  handleRowValidating: (e: any) => void;
  handleRowUpdating: (e: any) => void;
  handleRowInserting: (e: any) => void;
  validateProject: (project: any) => { isValid: boolean; errors: Record<string, string> };
}

/**
 * Hook for project grid event handlers
 * Extracts the event handling logic from the component to reduce clutter
 */
export function useProjectGridHandlers({
  nextProjectNumber,
  refreshNextNumber,
  userToken,
}: {
  nextProjectNumber?: string;
  refreshNextNumber?: () => void;
  userToken?: string;
}) {
  // Get business logic functions from projects context
  const { validateProject, generateProjectId, setProjectDefaults } = useProjects();
  
  // Wrap the context's validation in a grid-friendly handler
  const handleRowValidating = useCallback((e: any) => {
    // For row validation, we should specifically validate e.data
    // This contains the complete row data being validated (either new or existing)
    
    // Check if we have valid data to validate
    if (!e.data || typeof e.data !== 'object') {
      // Allow operation to continue if we can't validate
      e.isValid = true;
      return;
    }
    
    // Validate the row data
    const isValid = validateProject(e.data);
    
    // Set validation result on the event
    e.isValid = isValid;
    
    // If validation failed, we need to cancel the operation
    if (!isValid) {
      e.cancel = true;
    }
  }, [validateProject]);
  
  // Handle row updating - validate before update
  const handleRowUpdating = useCallback((e: any) => {
    // Create a combined object with the changes applied
    const updatedProject = {
      ...e.oldData,
      ...e.newData
    };
    
    // Validate the combined object
    const isValid = validateProject(updatedProject);
    
    // Update the event with validation result
    e.isValid = isValid;
    
    // If validation failed, cancel the operation
    if (!isValid) {
      e.cancel = true;
    }
    
    // Grid will handle the update through its OData endpoint after validation
  }, [validateProject]);
  
  // Handle row inserting - let the grid handle the API call directly
  const handleRowInserting = useCallback((e: any) => {
    if (e.data) {
      // Apply default values using context's business logic
      e.data = setProjectDefaults(e.data, nextProjectNumber);

      // Watch for completion using native DataGrid CUD event pipeline
      if (refreshNextNumber) {
        // We need to access the ODataStore methods that are available on the DataSource
        const dataSource = e.component.getDataSource();

        // Create a one-time insert event handler on the store
        const store = dataSource.store();
        const originalInsert = store.insert;
        
        // Override insert temporarily to know when it completes
        store.insert = function(values, ...args) {
          // Call original insert and get the promise
          const result = originalInsert.call(this, values, ...args);
          
          // When insert completes, refresh the next number
          if (result && result.then) {
            result.then(() => {
              refreshNextNumber();
              
              // Restore original insert method
              store.insert = originalInsert;
            });
          } else {
            // Restore immediately if no promise
            store.insert = originalInsert;
          }
          
          return result;
        };
      }
    }
  }, [nextProjectNumber, refreshNextNumber, setProjectDefaults]);
  
  // Handle row removing - let the grid handle the API call directly
  const handleRowRemoving = useCallback((e: any) => {
    // Grid will handle the deletion through its OData endpoint
    // No need to call deleteProject or cancel the default behavior
    
    // Watch for completion of delete operation
    if (refreshNextNumber) {
      const dataSource = e.component.getDataSource();
      const store = dataSource.store();
      const originalRemove = store.remove;
      
      // Override remove temporarily to know when it completes
      store.remove = function(key, ...args) {
        // Call original remove and get the promise
        const result = originalRemove.call(this, key, ...args);
        
        // When remove completes, refresh the next number
        if (result && result.then) {
          result.then(() => {
            refreshNextNumber();
            
            // Restore original remove method
            store.remove = originalRemove;
          });
        } else {
          // Restore immediately if no promise
          store.remove = originalRemove;
        }
        
        return result;
      };
    }
  }, [refreshNextNumber]);
  
  // Handle initializing new row
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Set default values using the context's business logic
      e.data = setProjectDefaults(e.data, nextProjectNumber);
    }
  }, [nextProjectNumber, setProjectDefaults]);
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    // Expose the context's validateProject directly for external use
    validateProject
  };
}
