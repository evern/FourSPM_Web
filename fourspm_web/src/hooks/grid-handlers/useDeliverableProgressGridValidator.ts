import { useCallback } from 'react';
import { useDeliverableGateDataProvider } from '../data-providers/useDeliverableGateDataProvider';
import { compareGuids } from '../../utils/guid-utils';

/**
 * Interface for validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorField?: string;
}

/**
 * Validator hook for deliverable progress data
 * Provides validation logic for deliverable progress updates
 */
export function useDeliverableProgressGridValidator() {
  // Get deliverable gates data from the provider
  const { gates: deliverableGates } = useDeliverableGateDataProvider();

  /**
   * Validates that progress percentage doesn't exceed gate maximum
   * @param e Validation event with row data
   * @returns true if valid, false if invalid
   */
  const validateGatePercentage = useCallback((e: any): boolean => {
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
  }, [deliverableGates]);

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
   * Validates a deliverable progress entry
   * @param progress The progress data to validate
   * @returns Validation result
   */
  const validateProgress = useCallback((progress: Record<string, any>): ValidationResult => {
    // Check basic percentage range
    if (progress.cumulativeEarntPercentage !== undefined) {
      if (progress.cumulativeEarntPercentage < 0 || progress.cumulativeEarntPercentage > 1) {
        return {
          isValid: false,
          errorMessage: 'Percentage must be between 0% and 100%',
          errorField: 'cumulativeEarntPercentage'
        };
      }
      
      // Check gate maximum percentage
      if (progress.deliverableGateGuid) {
        const currentGate = deliverableGates.find(gate => 
          compareGuids(gate.guid, progress.deliverableGateGuid)
        );
        
        if (currentGate && progress.cumulativeEarntPercentage > currentGate.maxPercentage) {
          return {
            isValid: false,
            errorMessage: `Percentage cannot exceed gate maximum of ${(currentGate.maxPercentage * 100).toFixed(0)}%`,
            errorField: 'cumulativeEarntPercentage'
          };
        }
      }
      
      // Check previous and future period constraints
      if (progress.previousPeriodEarntPercentage !== undefined && 
          progress.cumulativeEarntPercentage < progress.previousPeriodEarntPercentage) {
        return {
          isValid: false,
          errorMessage: `Percentage cannot be less than what's already reported in previous periods (${(progress.previousPeriodEarntPercentage * 100).toFixed(0)}%)`,
          errorField: 'cumulativeEarntPercentage'
        };
      }
      
      if (progress.futurePeriodEarntPercentage !== undefined && 
          progress.cumulativeEarntPercentage + progress.futurePeriodEarntPercentage > 1.0) {
        return {
          isValid: false,
          errorMessage: `Combined percentage with future periods cannot exceed 100% (current: ${(progress.cumulativeEarntPercentage * 100).toFixed(0)}%, future: ${(progress.futurePeriodEarntPercentage * 100).toFixed(0)}%)`,
          errorField: 'cumulativeEarntPercentage'
        };
      }
    }

    // All checks passed
    return { isValid: true };
  }, [deliverableGates]);

  return {
    validateProgressRow,
    validateProgress,
    validateGatePercentage
  };
}
