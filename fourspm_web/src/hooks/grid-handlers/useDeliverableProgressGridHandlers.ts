import { useCallback } from 'react';
import { handleProgressUpdate } from '../../adapters/progress.adapter';
import { updateDeliverableGate } from '../../adapters/deliverable.adapter';
import { useGridUtils } from '../utils/useGridUtils';
import { useDeliverableProgressGridValidator, ValidationResult } from './useDeliverableProgressGridValidator';
import { useDeliverableGateDataProvider } from '../data-providers/useDeliverableGateDataProvider';
import { compareGuids } from '../../utils/guid-utils';

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
  setCellValue: (rowIndex: number, fieldName: string, value: any) => boolean;
  validateProgress: (progress: Record<string, any>) => ValidationResult;
  validateGatePercentage: (e: any) => void;
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
  const { projectGuid, userToken, getSelectedPeriod, progressDate } = options;
  
  // Get grid utility methods
  const { setCellValue, handleGridInitialized, reloadGridDataSource } = useGridUtils();
  
  // Get validator methods
  const { validateProgressRow, validateProgress } = useDeliverableProgressGridValidator();
  
  // Get deliverable gates data
  const { gates: deliverableGates } = useDeliverableGateDataProvider();
  
  /**
   * Process a single progress update, handling both gate changes and percentage updates
   * This matches the implementation pattern from the collection controller
   * @param key The deliverable GUID
   * @param newData The new data to apply
   * @param oldData The original data before changes
   * @returns Promise that resolves when the update is complete
   */
  const processProgressUpdate = useCallback(async (
    key: string,
    newData: any,
    oldData: any
  ): Promise<void> => {
    // First, check if gate update is needed
    if (newData.deliverableGateGuid !== undefined && 
        oldData.deliverableGateGuid !== newData.deliverableGateGuid) {
      // Update the deliverable gate in the backend using the adapter directly
      await updateDeliverableGate(key, newData.deliverableGateGuid, userToken || '');
    }
    
    // Next, check if progress update is needed
    if (newData.cumulativeEarntPercentage !== undefined) {
      // Call the progress service to update the backend
      await handleProgressUpdate(
        key,
        { 
          cumulativeEarntPercentage: newData.cumulativeEarntPercentage,
          totalHours: newData.totalHours || 0
        },
        getSelectedPeriod(), // Call the function to get current value
        oldData,
        userToken || ''
      );
    }
  }, [getSelectedPeriod, userToken]);

  /**
   * Handles row updating event for the grid
   * Aligns with Direct ODataGrid CRUD pattern by keeping the handler lightweight
   * Responsible for progress updates via adapter
   */
  const handleRowUpdating = useCallback((e: any) => {
    if (!userToken) {
      e.cancel = true;
      throw new Error('Authentication token is missing');
    }
    
    // Cancel the standard update since we're handling it manually
    e.cancel = true;
    
    // Create a modified update function that handles the API call and grid refresh
    const update = async () => {
      try {
        // Process the update through our specialized handler
        await processProgressUpdate(e.key || e.oldData.guid, e.newData, e.oldData);
        
        // Mark the grid as needing refresh after this edit
        if (e.component) {
          // Force the grid to refresh data from server
          setTimeout(() => {
            // This is important - first end edit mode, then reload data
            if (e.component.hasEditData()) {
              e.component.cancelEditData();
            }
            // Reload the grid data to reflect the changes
            if (e.component.getDataSource && typeof e.component.getDataSource === 'function') {
              e.component.getDataSource().reload();
            } else {
              e.component.refresh();
            }
          }, 50);
        }
      } catch (error) {
        console.error('Error updating progress:', error);
        
        // Refresh grid on error too
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
   * Validates that progress percentage doesn't exceed gate maximum
   * @param e Validation event with row data
   */
  const validateGatePercentage = useCallback((e: any) => {
    if (e.newData.cumulativeEarntPercentage !== undefined) {
      // Get the new percentage value
      const newPercentage = e.newData.cumulativeEarntPercentage;
      
      // Get the current gate - check newData first in case the gate is being changed
      const gateGuid = e.newData.deliverableGateGuid !== undefined 
        ? e.newData.deliverableGateGuid 
        : e.oldData.deliverableGateGuid;
        
      const currentGate = deliverableGates.find(gate => 
        compareGuids(gate.guid, gateGuid)
      );
      
      // Validate against gate max percentage
      if (currentGate && newPercentage > currentGate.maxPercentage) {
        e.isValid = false;
        e.errorText = `Progress cannot exceed ${(currentGate.maxPercentage * 100).toFixed(0)}% for the selected gate (${currentGate.name}).`;
      }
    }
  }, [deliverableGates]);

  /**
   * Handles row validating event for the grid
   * Uses the validator to check progress data
   */
  const handleRowValidating = useCallback((e: any) => {
    // First check gate percentage limits
    validateGatePercentage(e);
    
    // Then run the standard validation if gate validation passed
    if (e.isValid !== false) {
      validateProgressRow(e);
    }
  }, [validateProgressRow, validateGatePercentage]);

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
        
        // Find the selected gate
        const selectedGate = deliverableGates.find(gate => 
          compareGuids(gate.guid, args.value)
        );
        
        if (selectedGate && selectedGate.autoPercentage !== null) {
          // Get the current cumulativeEarntPercentage
          const currentValue = e.row.data.cumulativeEarntPercentage || 0;
          
          // Only update if the auto percentage is higher than current value
          if (selectedGate.autoPercentage > currentValue) {
            // Use the grid utils to set the cell value
            e.component.cellValue(e.row.rowIndex, 'cumulativeEarntPercentage', selectedGate.autoPercentage);
          }
          
          // This ensures we save the changes when ending edit mode
          setTimeout(() => {
            // Get the grid instance
            const grid = e.component;
            
            // Belt-and-suspenders approach to ensure edit operation is complete
            if (grid && grid.hasEditData && grid.hasEditData()) {
              // Save current cell's changes
              grid.saveEditData();
              
              // After saving, end edit mode for a clean state
              setTimeout(() => {
                if (grid.hasEditData && grid.hasEditData()) {
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
    setCellValue,
    validateProgress,
    validateGatePercentage
  };
}
