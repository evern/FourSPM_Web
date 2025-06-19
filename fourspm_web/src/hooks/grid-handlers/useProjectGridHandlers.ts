import { useCallback, useRef, useEffect } from 'react';
import { useProjects } from '../../contexts/projects/projects-context';

/**
 * Interface for project grid validation handlers
 */
export interface ProjectGridValidationHandlers {
  handleRowValidating: (e: any) => void;
  handleRowUpdating: (e: any) => void;
  handleRowInserting: (e: any) => void;
  handleRowRemoving: (e: any) => void;
  handleInitNewRow: (e: any) => void;
  handleGridInitialized: (e: any) => void;
  resetAndReloadGrid: () => void;
  validateProject: (project: any) => { isValid: boolean; errors: Record<string, string> };
}

/**
 * Interface for project grid handlers
 */
export interface ProjectGridHandlersResult {
  handleRowValidating: (e: any) => void;
  handleRowUpdating: (e: any) => void;
  handleRowInserting: (e: any) => void;
  handleRowRemoving: (e: any) => void;
  handleInitNewRow: (e: any) => void;
  handleGridInitialized: (e: any) => void;
  resetGridState: () => void;
}

/**
 * Hook for project grid event handlers
 * Extracts the event handling logic from the component to reduce clutter
 */
export function useProjectGridHandlers({
  nextProjectNumber,
  refreshNextNumber,
  acquireToken,
}: {
  nextProjectNumber?: string;
  refreshNextNumber?: () => void;
  acquireToken?: () => Promise<string | null>;
}): ProjectGridHandlersResult {
  // Grid reference for direct control access
  const dataGridRef = useRef<any>(null);
  // Get access to the projects context state and functions
  const { state, validateProject, setProjectDefaults } = useProjects();
  
  // Wrap the context's validation in a grid-friendly handler
  const handleRowValidating = useCallback((e: any) => {
    // In DevExtreme, for cell editing mode, the data is in e.newData
    // For row editing mode, it might be in e.data
    const dataToValidate = e.newData || e.data;
    
    // Check if we have valid data to validate
    if (!dataToValidate || typeof dataToValidate !== 'object') {
      // Allow operation to continue if we can't validate
      e.isValid = true;
      return;
    }
    
    // For updates, we need to combine oldData with newData
    // For inserts, dataToValidate is already complete
    const completeData = e.oldData 
      ? { ...e.oldData, ...e.newData } 
      : dataToValidate;
    
    // Validate the complete data using the context validator
    // Skip state updates since we're directly using the validation result
    const validationResult = validateProject(completeData, undefined, true);
    
    // Set validation result on the event
    e.isValid = validationResult.isValid;
    
    // If validation failed, we need to cancel the operation
    if (!validationResult.isValid) {
      e.cancel = true;
      
      // Set the errorText property to the validation error message
      // This will be used by ODataGrid's notify function
      if (validationResult.errorMessage) {
        e.errorText = validationResult.errorMessage;
      }
    }
  }, [validateProject]);
  
  // Handle row updating - validate before update
  const handleRowUpdating = useCallback((e: any) => {
    // Ensure we have valid data objects
    if (!e.oldData || !e.newData) {
      e.isValid = false;
      e.cancel = true;
      return;
    }
    
    // Create a combined object with the changes applied
    const updatedProject = {
      ...e.oldData,
      ...e.newData
    };
    
    try {
      // Validate the combined object using the context validator
      const validationResult = validateProject(updatedProject);
      
      // Update the event with validation result
      e.isValid = validationResult.isValid;
      
      // If validation failed, cancel the operation
      if (!validationResult.isValid) {
        e.cancel = true;
        
        // Set the error message for the grid notification
        if (validationResult.errorMessage) {
          e.errorText = validationResult.errorMessage;
        }
      }
    } catch (error) {
      // If validation throws an error, cancel the operation
      console.error('Validation error:', error);
      e.isValid = false;
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
  
  // Handle grid initialization to properly set up grid instance
  const handleGridInitialized = useCallback((e: any) => {
    // Store grid reference
    dataGridRef.current = e.component;
    
    // Small delay to ensure the component is fully rendered
    setTimeout(() => {
      if (dataGridRef.current) {
        try {
          // For virtual scrolling, ensure page size is set appropriately
          const dataSource = dataGridRef.current.getDataSource();
          if (dataSource) {
            // Force a reload after initialization to ensure proper data loading
            dataSource.reload();
          }
        } catch (error) {
          console.error('Grid initialization error:', error);
        }
      }
    }, 100);
  }, []);
  
  // Reset grid state and reload data - necessary for virtual scrolling
  const resetGridState = useCallback(() => {
    if (!dataGridRef.current) return;
    
    // Reset internal grid state
    // This is critical for virtual scrolling to work properly after tab switching
    const grid = dataGridRef.current;
    
    try {
      // Clear all internal state first before reloading
      // Order is important here - first clear state, then reload
      if (grid.clearFilter) grid.clearFilter();
      if (grid.clearSelection) grid.clearSelection();
      if (grid.clearSorting) grid.clearSorting();
      
      // Reset page index to zero if method exists
      if (grid.pageIndex) grid.pageIndex(0);
      
      // Small delay to ensure state is fully reset before reload
      setTimeout(() => {
        // Then call reload() on the dataSource
        const dataSource = grid.getDataSource();
        if (dataSource && dataSource.reload) {
          dataSource.reload();
        }
      }, 50);
    } catch (error) {
      console.error('Error resetting grid state:', error);
    }
  }, []);
  
  // Handle window focus events to reset and reload grid
  useEffect(() => {
    const handleFocus = () => {
      resetGridState();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [resetGridState]);
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized,
    resetGridState
  };
}
