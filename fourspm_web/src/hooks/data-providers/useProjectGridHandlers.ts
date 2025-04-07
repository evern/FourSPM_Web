import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Default validation rules for projects
export const PROJECT_VALIDATION_RULES = [
  { field: 'projectNumber', required: true, maxLength: 50, errorText: 'Project Number is required' },
  { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
  { field: 'projectStatus', required: true, errorText: 'Project Status is required' },
  { field: 'clientGuid', required: true, errorText: 'Client is required' }
];

/**
 * Hook for project grid event handlers
 * Extracts the event handling logic from the component to reduce clutter
 */
export function useProjectGridHandlers({
  validateProject,
  nextProjectNumber,
  refreshNextNumber
}: {
  validateProject: (data: any, rules: any[]) => boolean;
  nextProjectNumber?: string;
  refreshNextNumber?: () => void;
}) {
  // Handle row validation
  const handleRowValidating = useCallback((e: any) => {
    if (e.newData) {
      const isValid = validateProject(e.newData, PROJECT_VALIDATION_RULES);
      e.isValid = isValid;
      
      // If there are validation errors, stop the grid from proceeding
      if (!isValid) {
        e.cancel = true;
      }
    }
  }, [validateProject]);
  
  // Handle row updating - let the grid handle the API call directly
  const handleRowUpdating = useCallback((e: any) => {
    // Grid will handle the update through its OData endpoint
    // No need to call updateProject or cancel the default behavior
  }, []);
  
  // Handle row inserting - let the grid handle the API call directly
  const handleRowInserting = useCallback((e: any) => {
    if (e.data) {
      // If a GUID is needed, we can add it here
      if (!e.data.guid) {
        e.data.guid = uuidv4();
      }
      // Set default status if not provided
      if (!e.data.projectStatus) {
        e.data.projectStatus = 'TenderInProgress';
      }

      // Set projectNumber if not already set
      if (!e.data.projectNumber && nextProjectNumber) {
        e.data.projectNumber = nextProjectNumber;
      }

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
  }, [nextProjectNumber, refreshNextNumber]);
  
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
      // Set default values for new project
      e.data = {
        ...e.data,
        guid: e.data.guid || uuidv4(),
        projectNumber: e.data.projectNumber || nextProjectNumber || '',
        projectStatus: e.data.projectStatus || 'TenderInProgress' // Default status
      };
    }
  }, [nextProjectNumber]);
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow
  };
}
