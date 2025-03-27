import { useCallback, useMemo } from 'react';
import { Properties } from 'devextreme/ui/data_grid';
import { DeliverableGate } from '../../types/odata-types';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default validation rules for deliverable gates
 */
const DEFAULT_GATE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'name', 
    required: true, 
    maxLength: 100,
    errorText: 'Name cannot exceed 100 characters' 
  },
  { 
    field: 'maxPercentage', 
    required: true, 
    errorText: 'Max percentage is required' 
  }
];

/**
 * Applied to all deliverable gates validation - ensures autoPercentage cannot exceed maxPercentage
 * @param e The validation event object
 */
const validateAutoPercentage = (e: any): void => {
  if (e.isValid) {
    const data = e.newData;
    
    // Check if autoPercentage exceeds maxPercentage
    if (data.autoPercentage !== undefined && data.maxPercentage !== undefined) {
      const autoPercent = parseFloat(data.autoPercentage);
      const maxPercent = parseFloat(data.maxPercentage);
      
      if (!isNaN(autoPercent) && !isNaN(maxPercent) && autoPercent > maxPercent) {
        e.isValid = false;
        e.errorText = 'Auto percentage cannot exceed max percentage';
      }
    }
  }
};

/**
 * Interface for Deliverable Gate data hook
 */
export interface DeliverableGateCollectionControllerHook extends GridOperationsHook<DeliverableGate> {
  handleInitNewRow: (e: any) => void;
}

/**
 * Hook to fetch and provide deliverable gates data
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing deliverable gates data and handler functions
 */
export const useDeliverableGatesCollectionController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_GATE_VALIDATION_RULES
): DeliverableGateCollectionControllerHook => {
  // Create collection hook for deliverable gates with integrated grid operations and validation
  const collectionHook = createGridOperationHook<DeliverableGate>({
    // Spread all grid operation callbacks directly
    ...gridConfig,
    validationRules // Pass validation rules directly to the collection hook
  }, userToken) as GridOperationsHook<DeliverableGate>;
  
  // Create a direct validation handler that includes auto percentage validation
  const customOnRowValidating: Properties['onRowValidating'] = useCallback((e: any) => {
    // First run the standard validation from the collection hook if available
    if (collectionHook.handleRowValidating) {
      collectionHook.handleRowValidating(e);
    }
    
    // Then run the auto percentage validation if standard validation passes
    if (e.isValid) {
      validateAutoPercentage(e);
    }
  }, [collectionHook.handleRowValidating]);
  
  // Initialize new row with default values
  const handleInitNewRow = useCallback((e: any) => {
    e.data = {
      guid: uuidv4(),
      name: '',
      maxPercentage: 1,
      autoPercentage: 0
    };
  }, []);
  
  return {
    // Spread all grid operations except for handleRowValidating
    ...collectionHook,
    // Replace with the extended version that integrates autoPercentage validation
    handleRowValidating: customOnRowValidating,
    // Add handleInitNewRow functionality
    handleInitNewRow
  };
};
