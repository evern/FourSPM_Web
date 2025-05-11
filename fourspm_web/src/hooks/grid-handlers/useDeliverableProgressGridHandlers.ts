import { useCallback, useRef } from 'react';
import { useDeliverableProgress } from '../../contexts/deliverable-progress/deliverable-progress-context';
import { ValidationResult } from '../../contexts/deliverable-progress/deliverable-progress-types';

/**
 * Interface for deliverable progress grid handlers
 */
export interface DeliverableProgressGridHandlers {
  // Grid event handlers
  handleRowUpdating: (e: any) => Promise<void>;
  handleRowValidating: (e: any) => void;
  handleEditorPreparing: (e: any) => void;
  handleGridInitialized: (e: any) => void;
  
  // Utility methods
  validateProgress: (progress: Record<string, any>) => ValidationResult;
  validateGatePercentage: (e: any) => boolean;
}

/**
 * Hook for managing deliverable progress grid event handlers
 * @param options Configuration options for grid handlers
 * @returns Object containing all grid event handlers
 */
export function useDeliverableProgressGridHandlers(options: {
  projectGuid: string;
  userToken?: string;
  getSelectedPeriod: () => number;
  progressDate: Date;
}): DeliverableProgressGridHandlers {
  
  // Get the context functions that contain the moved business logic
  const { 
    validateGatePercentage, 
    validateProgress, 
    processProgressUpdate,
    deliverableGates
  } = useDeliverableProgress();
  
  // Grid reference for operations
  const gridRef = useRef<any>(null);
  
  /**
   * Handles the grid initialization event
   */
  const handleGridInitialized = useCallback((e: any) => {
    gridRef.current = e.component;
  }, []);
  
  // Note: processProgressUpdate is now obtained from the context

  /**
   * Handles row updating event for the grid
   * Aligns with Direct ODataGrid CRUD pattern by keeping the handler lightweight
   * Responsible for progress updates via adapter
   */
  const handleRowUpdating = useCallback((e: any) => {
    // Cancel the standard update since we're handling it manually
    e.cancel = true;
    
    // Create a modified update function that handles the API call and grid refresh
    const update = async () => {
      try {
        // Process the update through the context handler
        await processProgressUpdate(e.key || e.oldData.guid, e.newData, e.oldData);
        
        // Mark the grid as needing refresh after this edit
        if (e.component) {
          // Force the grid to refresh data from server
          setTimeout(() => {
            // This is important - first end edit mode, then reload data
            if (e.component.hasEditData()) {
              e.component.cancelEditData();
            }
            e.component.getDataSource().reload();
          }, 50);
        }
      } catch (error) {
        // Re-throw the error so the grid can display it appropriately
        console.error('Error updating progress:', error);
        if (e.component) {
          e.component.refresh();
        }
        
        // Re-throw the error to maintain the Promise<void> signature
        throw error;
      }
    };
    
    // Start the update process and return its promise
    return update();
  }, [processProgressUpdate]);

  /**
   * Validates a row update for the grid
   * @param e The grid row validating event
   */
  const validateProgressRow = useCallback((e: any) => {
    // First check basic percentage range
    if (e.newData.cumulativeEarntPercentage !== undefined) {
      // Validate the percentage is between 0 and 1 (0% and 100%)
      if (e.newData.cumulativeEarntPercentage < 0 || e.newData.cumulativeEarntPercentage > 1) {
        e.isValid = false;
        e.errorText = 'Percentage must be between 0% and 100%';
        return;
      }
      
      // Then perform comprehensive validation including gate maximum and period constraints
      validateGatePercentage(e);
    }
  }, [validateGatePercentage]);

  /**
   * Handles row validating event for the grid
   * Uses the validator to check progress data
   */
  const handleRowValidating = useCallback((e: any) => {
    // Call validateProgressRow which delegates to context validation
    validateProgressRow(e);
  }, [validateProgressRow]);

  /**
   * Handles editor preparing event for the grid
   * Customizes editor options
   */
  const handleEditorPreparing = useCallback((e: any) => {
    // Configure editor options for the cumulative percentage field
    if (e.dataField === 'cumulativeEarntPercentage') {
      e.editorOptions.min = 0;
      e.editorOptions.max = 1;
      e.editorOptions.step = 0.01;
      e.editorOptions.format = 'percent';
    }
    
    // Make most fields read-only except for cumulative percentage
    if (e.dataField !== 'cumulativeEarntPercentage' && e.dataField !== 'deliverableGateGuid') {
      e.editorOptions.readOnly = true;
    }
    
    // Check if this is the gate field being edited - implement auto-percentage assignment
    if (e.dataField === 'deliverableGateGuid') {
      // Store the original onValueChanged handler if it exists
      const originalValueChanged = e.editorOptions.onValueChanged;
      
      // Override the onValueChanged handler
      e.editorOptions.onValueChanged = (args: any) => {
        // Call the original handler if it exists
        if (originalValueChanged) {
          originalValueChanged(args);
        }
        
        if (!args.value) return; // Skip if no gate was selected
        
        // Find the selected gate - we use the current deliverableGates from closure
        // This works because we've added deliverableGates to the dependency array below
        const selectedGate = deliverableGates.find(gate => 
          gate.guid === args.value
        );
        
        if (selectedGate && selectedGate.autoPercentage !== null) {
          // Get the current cumulativeEarntPercentage
          const currentValue = e.row.data.cumulativeEarntPercentage || 0;
          
          // Only update if the auto percentage is higher than current value
          if (selectedGate.autoPercentage > currentValue) {
            // Use gridRef which is more reliable with virtual scrolling
            gridRef.current?.cellValue(e.row.rowIndex, 'cumulativeEarntPercentage', selectedGate.autoPercentage);
          }
          
          // This ensures we save the changes when ending edit mode
          setTimeout(() => {
            // Use gridRef for more reliable operation with virtual scrolling
            const grid = gridRef.current;
            
            // Belt-and-suspenders approach to ensure edit operation is complete
            if (grid && grid.hasEditData && grid.hasEditData()) {
              // Save current cell's changes
              grid.saveEditData();
              
              // After saving, end edit mode for a clean state
              setTimeout(() => {
                if (grid && grid.hasEditData && grid.hasEditData()) {
                  grid.cancelEditData();
                }
              }, 100);
            }
          }, 50);
        }
      };
    }
  }, [deliverableGates]);

  return {
    handleRowUpdating,
    handleRowValidating,
    handleEditorPreparing,
    handleGridInitialized,
    validateProgress,
    validateGatePercentage
  };
}
