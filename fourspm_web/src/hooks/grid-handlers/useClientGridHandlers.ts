import { useCallback, useRef } from 'react';
import { CLIENTS_ENDPOINT } from '@/config/api-endpoints';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { useClients } from '@/contexts/clients/clients-context';

export function useClientGridHandlers() {
  const { setError, invalidateAllLookups, validationRules, getDefaultValues, refreshNextNumber, nextNumber } = useClients();

  // Reference to the DataGrid component instance
  const dataGridRef = useRef<any>(null);

  const gridOperations = createGridOperationHook({
    endpoint: CLIENTS_ENDPOINT,
    validationRules: validationRules,
    onUpdateError: (error) => {
      console.error('Failed to update client:', error);
      setError('Failed to update client: ' + error.message);
    },
    onDeleteError: (error) => {
      console.error('Failed to delete client:', error);
      setError('Failed to delete client: ' + error.message);
    },
    onInsertError: (error) => {
      console.error('Failed to create client:', error);
      setError('Failed to create client: ' + error.message);
    },
    invalidateCache: invalidateAllLookups,
    defaultValues: getDefaultValues()
  });

  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting: baseRowInserting, // Rename to avoid conflict
    handleRowRemoving: baseRowRemoving, // Rename to avoid conflict
  } = gridOperations;
  
  // Custom implementation of handleInitNewRow to ensure we get the latest next number
  const handleInitNewRow = useCallback((e: any) => {
    // Get fresh default values with the latest next number
    const defaultValues = getDefaultValues();
    
    // Apply the values to the data
    e.data = defaultValues;
    
    // Set the client number directly from context rather than refreshing
    if (e && e.data) {
      e.data.number = nextNumber;
    }
  }, [getDefaultValues, nextNumber]);

  const handleGridInitialized = useCallback((e: any) => {
    // Store grid reference
    dataGridRef.current = e.component;
  }, []);

  // Handle row inserting event - track when inserts complete to refresh number
  const handleRowInserting = useCallback((e: any) => {
    if (e.data) {
      // Call the base handler first
      baseRowInserting(e);
      
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
  }, [baseRowInserting, refreshNextNumber]);

  // Handle row removing event - track when deletes complete to refresh number
  const handleRowRemoving = useCallback((e: any) => {
    // Call the base handler first
    baseRowRemoving(e);
    
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
  }, [baseRowRemoving, refreshNextNumber]);

  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting, // Use our custom handler with number tracking
    handleRowRemoving, // Use our custom handler with number tracking
    handleInitNewRow,
    handleGridInitialized
  };
}
