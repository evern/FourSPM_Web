import { useCallback } from 'react';
import { DELIVERABLE_GATES_ENDPOINT } from '@/config/api-endpoints';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { useDeliverableGates } from '@/contexts/deliverable-gates/deliverable-gates-context';
import { getToken } from '@/utils/token-store';

// Helper function to determine if a percentage value is in decimal form (0.01-0.99) or whole number form (1-100)
const isDecimalPercentage = (value: number): boolean => {
  return value > 0 && value < 1;
};

export function useDeliverableGateGridHandlers() { // Using Optimized Direct Access Pattern - no token parameter needed
  // Get references without causing state changes
  const { validationRules, getDefaultValues } = useDeliverableGates();
  
  // Create a non-state-updating version of error handling
  const consoleErrorOnly = (operation: string, error: any) => {
    // Log to console but don't update state to prevent flickering
    console.error(`Failed to ${operation} deliverable gate:`, error);
  };
  
  // Create a non-state-updating version of cache invalidation
  const noOpInvalidate = () => {
    // No-op function that does nothing to prevent state changes
    // The grid handles its own internal cache
  };
  
  const gridOperations = createGridOperationHook({
    endpoint: DELIVERABLE_GATES_ENDPOINT,
    validationRules: validationRules,
    // Only log errors, don't update state
    onUpdateError: (error) => consoleErrorOnly('update', error),
    onDeleteError: (error) => consoleErrorOnly('delete', error),
    onInsertError: (error) => consoleErrorOnly('create', error),
    // Add empty success handlers to prevent automatic refreshes
    onUpdateSuccess: () => {},
    onDeleteSuccess: () => {},
    onInsertSuccess: () => {},
    // Don't invalidate cache to prevent state changes
    invalidateCache: noOpInvalidate,
    defaultValues: getDefaultValues()
    // Using Optimized Direct Access Pattern - token is retrieved directly in leaf methods
  });

  // Destructure the base handlers from grid operations
  const { 
    handleRowValidating: baseHandleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
  } = gridOperations;
  
  // Override handleRowValidating to add our custom validation
  const handleRowValidating = useCallback((e: any) => {
    // First run the base validation
    baseHandleRowValidating(e);
    
    // Skip additional validation if already invalid
    if (!e.isValid) return;

    // Then add our custom validation for autoPercentage <= maxPercentage
    // Get maxPercentage from either newData (if being edited) or oldData (existing value)
    if (e.newData.autoPercentage !== undefined && e.newData.autoPercentage !== null) {
      // Get the effective max percentage - if it's being edited use newData, otherwise use oldData
      const maxPercentage = e.newData.maxPercentage !== undefined ? 
        Number(e.newData.maxPercentage) : 
        (e.oldData?.maxPercentage !== undefined ? Number(e.oldData.maxPercentage) : 100);
      
      if (Number(e.newData.autoPercentage) > maxPercentage) {
        // Format the values correctly, showing a clean percentage with at most 1 decimal place
        const formatPercentage = (value: number): string => {
          // Determine if we need to multiply by 100 (if decimal format)
          const percentValue = isDecimalPercentage(value) ? value * 100 : value;
          // Format with 1 decimal place if needed, but trim trailing zeros
          return parseFloat(percentValue.toFixed(1)) + '%';
        };
        
        const autoPercentDisplay = formatPercentage(Number(e.newData.autoPercentage));
        const maxPercentDisplay = formatPercentage(maxPercentage);
        
        // Format a more descriptive error message with specific values
        const errorMessage = `Auto percentage (${autoPercentDisplay}) cannot exceed max percentage (${maxPercentDisplay})`;
        
        // Set the validation error in a way that will be displayed
        e.isValid = false;
        e.errorText = errorMessage;
      }
    }
  }, [baseHandleRowValidating]);

  const handleGridInitialized = useCallback((e: any) => {

  }, []);

  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  };
}
