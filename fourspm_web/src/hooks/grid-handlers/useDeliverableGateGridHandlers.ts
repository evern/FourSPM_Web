import { useCallback } from 'react';
import { DELIVERABLE_GATES_ENDPOINT } from '@/config/api-endpoints';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { useDeliverableGates } from '@/contexts/deliverable-gates/deliverable-gates-context';

export function useDeliverableGateGridHandlers({ acquireToken }: { acquireToken?: () => Promise<string | null> }) {
  const { setError, invalidateAllLookups, validationRules, getDefaultValues } = useDeliverableGates();

  const gridOperations = createGridOperationHook({
    endpoint: DELIVERABLE_GATES_ENDPOINT,
    validationRules: validationRules,
    onUpdateError: (error) => {
      console.error('Failed to update deliverable gate:', error);
      setError('Failed to update deliverable gate: ' + error.message);
    },
    onDeleteError: (error) => {
      console.error('Failed to delete deliverable gate:', error);
      setError('Failed to delete deliverable gate: ' + error.message);
    },
    onInsertError: (error) => {
      console.error('Failed to create deliverable gate:', error);
      setError('Failed to create deliverable gate: ' + error.message);
    },
    invalidateCache: invalidateAllLookups,
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
