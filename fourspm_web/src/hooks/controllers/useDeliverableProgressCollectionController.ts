import { compareGuids } from '../../utils/guid-utils';
import { handleProgressUpdate } from '../../adapters/progress.adapter';
import { updateDeliverableGate } from '../../adapters/deliverable.adapter';
import { DeliverableProgressDto } from '../../types/app-types';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig, ProjectScopedGridController } from '../interfaces/grid-operation-hook.interfaces';
import { GridUtils } from '../interfaces/grid-utils.interface';
import { useCallback, useEffect } from 'react';
import { useDeliverableGateDataProvider } from '../data-providers/useDeliverableGateDataProvider';
import { useGridUtils } from '../utils/useGridUtils';
import { useProjectInfo } from '../utils/useProjectInfo';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default validation rules for progress entries
 */
const DEFAULT_PROGRESS_VALIDATION_RULES: ValidationRule[] = [
  {
    field: 'cumulativeEarntPercentage',
    required: true,
    min: 0,
    max: 1,
    errorText: 'Percentage must be between 0% and 100%'
  }
];

/**
 * Interface for Progress controller hook
 */
export interface DeliverableProgressCollectionControllerHook extends GridOperationsHook<DeliverableProgressDto>, ProjectScopedGridController<DeliverableProgressDto>, GridUtils {
  handleInitNewRow: (e: any) => void;
  handleEditorPreparing: (e: any) => void;
}

/**
 * Hook to manage progress data operations
 * @param userToken The user's authentication token
 * @param projectId The project ID to get progress for
 * @param currentPeriod The current progress period
 * @param gridConfig Optional grid operation configuration
 * @param validationRules Optional custom validation rules
 * @returns Progress controller hook with grid operations
 */
export const useDeliverableProgressCollectionController = (
  userToken: string | undefined,
  projectId: string | undefined,
  currentPeriod: number = 0,
  gridConfig: Partial<GridOperationsConfig> = {},
  validationRules: ValidationRule[] = DEFAULT_PROGRESS_VALIDATION_RULES
): DeliverableProgressCollectionControllerHook => {
  // Use the standardized grid utils hook instead of managing grid instance directly
  const gridUtils = useGridUtils();
  
  // Use the standardized hook for project info
  const { project, isLoading: isProjectLoading } = useProjectInfo(projectId, userToken);
  
  // Use the standardized hook for deliverable gates
  const { gates: deliverableGates, error: gatesError } = useDeliverableGateDataProvider();
  
  // Log any errors from gates loading
  useEffect(() => {
    if (gatesError) {
      console.error('Error loading deliverable gates in progress controller:', gatesError);
    }
  }, [gatesError]);
  
  /**
   * Initialize new row with default values
   */
  const handleInitNewRow = useCallback((e: any) => {
    // Initialize with defaults
    e.data = {
      guid: uuidv4(),
      projectGuid: projectId,
      currentPeriodEarntPercentage: 0,
      cumulativeEarntPercentage: 0
    };
  }, [projectId]);
  
  /**
   * Validates that progress percentage doesn't exceed gate maximum
   * @param e Validation event with row data
   */
  const validateGatePercentage = (e: any) => {
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
        e.errorText = `Percentage cannot exceed gate maximum of ${(currentGate.maxPercentage * 100).toFixed(0)}%`;
        return false;
      }
      
      // Use backend-provided values for previous and future period percentages
      const previousPeriodEarntPercentage = e.oldData.previousPeriodEarntPercentage || 0;
      const futurePeriodEarntPercentage = e.oldData.futurePeriodEarntPercentage || 0;
      
      // Validate that percentage doesn't decrease below previous period percentage
      if (newPercentage < previousPeriodEarntPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot be less than what's already reported in previous periods (${(previousPeriodEarntPercentage * 100).toFixed(0)}%)`;
        return false;
      }
      
      // Validate that percentage doesn't exceed future period percentage
      if (newPercentage + futurePeriodEarntPercentage > 1.0) {
        e.isValid = false;
        e.errorText = `Combined percentage with future periods cannot exceed 100% (current: ${(newPercentage * 100).toFixed(0)}%, future: ${(futurePeriodEarntPercentage * 100).toFixed(0)}%)`;
        return false;
      }
    }
    
    return true;
  };

  /**
   * Process a single progress update, handling both gate changes and percentage updates
   * @param key The deliverable GUID
   * @param newData The new data to apply
   * @param oldData The original data before changes
   * @returns Promise that resolves when the update is complete
   */
  const processProgressUpdate = async (
    key: string,
    newData: Partial<DeliverableProgressDto>,
    oldData: Partial<DeliverableProgressDto>
  ): Promise<void> => {
    // First, check if gate update is needed
    if (newData.deliverableGateGuid !== undefined && 
        oldData.deliverableGateGuid !== newData.deliverableGateGuid) {
      // Update the deliverable gate in the backend
      await updateDeliverableGate(key, newData.deliverableGateGuid, userToken || '');
    }
    
    // Next, check if progress update is needed
    if (newData.cumulativeEarntPercentage !== undefined) {
      // Call the progress service to update the backend
      await handleProgressUpdate(
        key,
        newData,
        currentPeriod,
        oldData
      );
    }
  };

  // Create collection hook for progress with integrated grid operations and validation
  const collectionHook = createGridOperationHook<DeliverableProgressDto>({
    // Spread all grid operation callbacks directly
    ...gridConfig,
    validationRules
  }, userToken) as GridOperationsHook<DeliverableProgressDto>;

  /**
   * Custom row updating handler for progress entries
   * This extends the standard grid functionality with specialized progress updating
   */
  const customHandleRowUpdating = async (e: any) => {
    // Standard handlers should run first (but they won't actually update data)
    if (collectionHook.handleRowUpdating) {
      collectionHook.handleRowUpdating(e);
    }
    
    // Cancel the standard update since we're handling it manually
    e.cancel = true;
    
    // Create a modified update function that handles the API call and grid refresh
    const update = async () => {
      try {
        // Process the update through our specialized handler
        await processProgressUpdate(e.key, e.newData, e.oldData);
        
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
        
        return true;
      } catch (error) {
        console.error('Error updating progress:', error);
        
        // Refresh grid on error too
        if (e.component) {
          e.component.refresh();
        }
        
        return false;
      }
    };
    
    // Start the update process
    update();
  };
  
  /**
   * Create custom row validating handler that includes gate percentage validation
   * @param e Validation event with row data
   */
  const customOnRowValidating = (e: any) => {
    console.log('Row validating event triggered:', e);
    
    // Run our custom validation directly - don't wait for standard validation
    if (e.newData.cumulativeEarntPercentage !== undefined) {
      console.log('Validating cumulativeEarntPercentage:', e.newData.cumulativeEarntPercentage);
      validateGatePercentage(e);
    }
    
    // Also run standard validation if available (for other fields)
    if (collectionHook.handleRowValidating && e.isValid !== false) {
      collectionHook.handleRowValidating(e);
    }
  };
  
  /**
   * Handle editor preparing events to implement auto-percentage update based on gate changes
   * @param e The editor preparing event args
   */
  const handleEditorPreparing = useCallback((e: any) => {
    // Check if this is the gate field being edited
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
          
          console.log('Gate changed:', {
            newGate: selectedGate.name,
            autoPercentage: selectedGate.autoPercentage,
            currentValue
          });
          
          // Only update if the auto percentage is higher than current value
          if (selectedGate.autoPercentage > currentValue) {
            // Use the grid utils to set the cell value
            console.log('Updating cumulativeEarntPercentage to:', selectedGate.autoPercentage);
            e.component.cellValue(e.row.rowIndex, 'cumulativeEarntPercentage', selectedGate.autoPercentage);
          }
        }
      };
    }
  }, [deliverableGates]);
  
  // Return the combined hooks with the custom handlers
  return {
    ...collectionHook,
    ...gridUtils, 
    handleRowUpdating: customHandleRowUpdating,
    handleRowValidating: customOnRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    project,
    isProjectLoading
  };
};
