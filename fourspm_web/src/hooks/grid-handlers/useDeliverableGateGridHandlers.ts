import { useCallback } from 'react';
import { DELIVERABLE_GATES_ENDPOINT } from '@/config/api-endpoints';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { useDeliverableGates } from '@/contexts/deliverable-gates/deliverable-gates-context';

export function useDeliverableGateGridHandlers({ acquireToken }: { acquireToken?: () => Promise<string | null> }) {
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
    defaultValues: getDefaultValues(),
    acquireToken
  });

  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
  } = gridOperations;

  const handleGridInitialized = useCallback((e: any) => {
    console.log('Deliverable Gate grid initialized');
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
