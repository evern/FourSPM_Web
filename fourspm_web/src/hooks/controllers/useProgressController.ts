import { compareGuids } from '../../utils/guid-utils';
import { handleProgressUpdate } from '../../adapters/progress.adapter';
import { updateDeliverableGate } from '../../adapters/deliverable-gate.adapter';
import { DeliverableGate } from '../../types/odata-types';
import { createCollectionHook } from '../factories/createCollectionHook';
import { GridEnabledCollectionHook, ValidationRule, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { API_CONFIG } from '../../config/api';
import { sharedApiService } from '../../api/shared-api.service';

/**
 * Data Transfer Object for deliverable progress information
 * Combines deliverable data with calculated progress values for UI consumption
 */
export interface DeliverableProgressDto {
  guid: string;
  name: string;
  description?: string;
  totalPercentageEarnt: number;
  deliverableGateGuid: string;
  totalHours?: number;
  projectGuid: string;
  previousPeriodEarntPercentage?: number; // Percentage earned in previous periods
  futurePeriodEarntPercentage?: number;   // Percentage earned in future periods
  cumulativeEarntPercentage?: number;     // Cumulative percentage earned up to and including current period
  currentPeriodEarntPercentage?: number;  // Percentage earned specifically in the current period
  currentPeriodEarntHours?: number;       // Hours earned in the current period
}

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
export interface ProgressControllerHook extends GridEnabledCollectionHook<DeliverableProgressDto> {
  // This hook provides standard collection functionality with grid operations
  // The grid-specific handlers are already included via GridEnabledCollectionHook
}

/**
 * Hook to manage progress data operations
 * @param userToken The user's authentication token
 * @param projectId The project ID to get progress for
 * @param deliverableGates List of deliverable gates for validation
 * @param currentPeriod The current progress period
 * @param gridConfig Optional grid operation configuration
 * @param validationRules Optional custom validation rules
 * @returns Progress controller hook with grid operations
 */
export const useProgressController = (
  userToken: string | undefined,
  projectId: string | undefined,
  deliverableGates: DeliverableGate[] = [],
  currentPeriod: number = 0,
  gridConfig: Partial<GridOperationsConfig> = {},
  validationRules: ValidationRule[] = DEFAULT_PROGRESS_VALIDATION_RULES
): ProgressControllerHook => {
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
      
      // Calculate total percentage across all periods
      const totalPercentage = newPercentage + futurePeriodEarntPercentage;
      
      // Prevent more than 100% allocation across all periods
      if (totalPercentage > 1) {
        e.isValid = false;
        e.errorText = `Total percentage across all periods cannot exceed 100%. Current total: ${(totalPercentage * 100).toFixed(0)}%`;
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
  const collectionHook = createCollectionHook<DeliverableProgressDto>({
    services: {
      // Get all progress entries for a project
      getAll: async (_options, token) => {
        if (!token || !projectId) throw new Error('Token and project ID are required');
        
        const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Deliverables/GetWithProgressPercentages?projectGuid=${projectId}&period=${currentPeriod}`;
        return sharedApiService.get<DeliverableProgressDto[]>(endpoint, token);
      }
      // We do not use the standard update method since our progress updates
      // require custom logic through the handleProgressUpdate function
    },
    callbacks: {
      onError: (error, operation) => console.error(`Error in Progress operation (${operation}):`, error),
      ...gridConfig
    },
    validationRules
  }, userToken, true) as GridEnabledCollectionHook<DeliverableProgressDto>;

  /**
   * Refresh the grid data to reflect server changes
   * @param component The grid component to refresh
   */
  const refreshGridData = (component: any): void => {
    if (!component) return;
    
    setTimeout(() => {
      // First end edit mode, then reload data
      if (component.hasEditData()) {
        component.cancelEditData();
      }
      component.getDataSource().reload();
    }, 50);
  };

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
    
    try {
      await processProgressUpdate(e.key, e.newData, e.oldData);
      refreshGridData(e.component);
    } catch (error) {
      console.error('Error updating progress:', error);
      refreshGridData(e.component); // Refresh on error too
    }
  };
  
  /**
   * Create custom row validating handler that includes gate percentage validation
   * @param e Validation event with row data
   */
  const onRowValidating = (e: any) => {
    // First run the standard validation from the collection hook if available
    if (collectionHook.onRowValidating) {
      collectionHook.onRowValidating(e);
    }
    
    // If standard validation passes, run the gate-specific validation
    if (e.isValid) {
      validateGatePercentage(e);
    }
  };
  
  // Return the combined hooks with the custom handlers
  return {
    ...collectionHook,
    handleRowUpdating: customHandleRowUpdating,
    onRowValidating
  };
};
