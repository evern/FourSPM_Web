import { useCallback, useMemo } from 'react';
import { DeliverableGate } from '../../types/odata-types';
import { fetchDeliverableGates, updateDeliverableGate } from '../../adapters/deliverable-gate.adapter';
import { createCollectionHook } from '../factories/createCollectionHook';
import { createEntityHook } from '../factories/createEntityHook';
import { GridEnabledCollectionHook, ValidationRule, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { EntityHook } from '../interfaces/entity-hook.interfaces';
import { Properties } from 'devextreme/ui/data_grid';

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
export interface DeliverableGateControllerHook extends GridEnabledCollectionHook<DeliverableGate>, Partial<EntityHook<DeliverableGate>> {
  // Additional deliverable gate-specific methods
  updateDeliverableGate: (deliverableKey: string, gateGuid: string) => Promise<boolean>;
  // For backward compatibility with existing code
  deliverableGates: DeliverableGate[];
  isLoadingGates: boolean;
}

/**
 * Hook to fetch and provide deliverable gates data
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing deliverable gates data and handler functions
 */
export const useDeliverableGatesController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_GATE_VALIDATION_RULES
): DeliverableGateControllerHook => {
  // Create collection hook for deliverable gates with integrated grid operations and validation
  const collectionHook = createCollectionHook<DeliverableGate>({
    services: {
      getAll: (_options, token) => fetchDeliverableGates(token || '')
    },
    callbacks: {
      onError: (error, operation) => {
        console.error(`Error in DeliverableGate operation (${operation}):`, error);
      },
      // Spread all grid operation callbacks directly
      ...gridConfig
    },
    validationRules // Pass validation rules directly to the collection hook
  }, userToken, true) as GridEnabledCollectionHook<DeliverableGate>;
  
  // Create a minimal entity hook for deliverable gates
  const entityHook = createEntityHook<DeliverableGate>({
    services: {}
  }, userToken);
  
  /**
   * Update a deliverable's gate - simple data operation that returns success status
   * @param deliverableKey The GUID of the deliverable to update
   * @param gateGuid The GUID of the new gate
   * @returns Promise resolving to true if successful, false otherwise
   */
  const updateDeliverableGateHandler = useCallback(async (
    deliverableKey: string, 
    gateGuid: string
  ): Promise<boolean> => {
    if (!userToken) return false;
    
    try {
      // Call the update service
      await updateDeliverableGate(deliverableKey, gateGuid, userToken);
      
      // Refresh collection to reflect the change
      await collectionHook.refreshCollection();
      return true;
    } catch (error) {
      console.error('Error updating deliverable gate:', error);
      return false;
    }
  }, [userToken, collectionHook]);
  
  // Create a direct validation handler that includes auto percentage validation
  const customOnRowValidating: Properties['onRowValidating'] = useCallback((e: any) => {
    // First run the standard validation from the collection hook if available
    if (collectionHook.onRowValidating) {
      collectionHook.onRowValidating(e);
    }
    
    // Then run the auto percentage validation if standard validation passes
    if (e.isValid) {
      validateAutoPercentage(e);
    }
  }, [collectionHook.onRowValidating]);
  
  return {
    ...collectionHook,
    ...entityHook,
    // Add deliverable gate-specific properties and methods
    updateDeliverableGate: updateDeliverableGateHandler,
    deliverableGates: collectionHook.collection.items,
    isLoadingGates: collectionHook.isCollectionLoading,
    onRowValidating: customOnRowValidating // Replace with the extended version that integrates autoPercentage validation
  };
};
