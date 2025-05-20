import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { AREAS_ENDPOINT } from '@/config/api-endpoints';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { useAreas } from '@/contexts/areas/areas-context';

interface UseAreaGridHandlersProps {
  acquireToken?: () => Promise<string | null>;
}

/**
 * Custom hook for area grid operations
 * Provides handlers for grid events and validation
 * Following the Reference Data Implementation Doctrine
 */
export function useAreaGridHandlers({ acquireToken }: UseAreaGridHandlersProps) {
  // Get the areas context for error reporting and cache invalidation
  const { setError, invalidateAllLookups, projectId } = useAreas();
  
  // Get next area number from the context instead of maintaining local state
  const { nextAreaNumber, refreshNextNumber } = useAreas();
  
  // Reference to the DataGrid component instance
  const dataGridRef = useRef<any>(null);
  
  // Default validation rules for areas
  const AREA_VALIDATION_RULES: ValidationRule[] = [
    { 
      field: 'number', // Updated to match the actual field name in the data model
      required: true, 
      maxLength: 20,
      errorText: 'Area Number is required and cannot exceed 20 characters' 
    },
    { 
      field: 'description', 
      required: true, 
      maxLength: 500,
      errorText: 'Description is required and cannot exceed 500 characters' 
    }
  ];

  // Use the grid operation hook factory with Area-specific configuration
  const gridOperations = createGridOperationHook({
    endpoint: AREAS_ENDPOINT,
    validationRules: AREA_VALIDATION_RULES,
    
    // Error handlers
    onUpdateError: (error) => {

      setError('Failed to update area: ' + error.message);
    },
    onDeleteError: (error) => {

      setError('Failed to delete area: ' + error.message);
    },
    onInsertError: (error) => {

      setError('Failed to create area: ' + error.message);
    },
    invalidateCache: invalidateAllLookups,
    defaultValues: {
      guid: uuidv4(),
      projectGuid: projectId,
      number: '',  // This will be overridden by our custom handleInitNewRow
      description: '',
    },
    acquireToken
  });
  
  // We already have state to track the next available area number at line 48
  
  // Extract all the handlers from the grid operations hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting: baseRowInserting, // Rename to avoid conflict
    handleRowRemoving: baseRowRemoving, // Rename to avoid conflict
    handleInitNewRow: baseInitNewRow, // Rename to avoid conflict
  } = gridOperations;

  // Handle grid initialization - store reference to grid
  const handleGridInitialized = useCallback((e: any) => {
    // Store grid reference
    dataGridRef.current = e.component;
  }, []);

  // Handle row inserting event - track when inserts complete to refresh number
  const handleRowInserting = useCallback((e: any) => {
    if (e.data) {
      // Apply the next area number to the new record
      e.data.number = nextAreaNumber;
      e.data.projectGuid = projectId;

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
  }, [nextAreaNumber, projectId, refreshNextNumber]);

  // Handle row removing event - track when deletes complete to refresh number
  const handleRowRemoving = useCallback((e: any) => {
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

  // Custom handleInitNewRow that applies the next available number
  const handleInitNewRow = useCallback((e: any) => {
    // First call the base handler
    baseInitNewRow(e);
    
    // Apply the next area number to the data
    if (e && e.data) {
      e.data.number = nextAreaNumber;
      e.data.projectGuid = projectId;
    }
  }, [baseInitNewRow, nextAreaNumber, projectId]);

  // Return all handlers for use in the component
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting, // Use our custom handler with number tracking
    handleRowRemoving, // Use our custom handler with number tracking
    handleInitNewRow, // Use our custom handler
    handleGridInitialized,
    refreshNextNumber,
    nextAreaNumber
  };
}
