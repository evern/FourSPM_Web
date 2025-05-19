import { useCallback } from 'react';
import { CLIENTS_ENDPOINT } from '@/config/api-endpoints';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { useClients } from '@/contexts/clients/clients-context';

export function useClientGridHandlers({ acquireToken }: { acquireToken: () => Promise<string | null> }) {
  const { setError, invalidateAllLookups, validationRules, getDefaultValues, refreshNextNumber } = useClients();

  const gridOperations = createGridOperationHook({
    endpoint: CLIENTS_ENDPOINT,
    validationRules: validationRules,
    onUpdateError: (error) => {
      console.error('Failed to update client:', error);
      setError('Failed to update client: ' + error.message);
    },
    onDeleteError: (error) => {
      console.error('Failed to delete client:', error);
      setError('Failed to delete client: ' + error.message);
    },
    onInsertError: (error) => {
      console.error('Failed to create client:', error);
      setError('Failed to create client: ' + error.message);
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
  } = gridOperations;
  
  // Custom implementation of handleInitNewRow to ensure we get the latest next number
  const handleInitNewRow = useCallback((e: any) => {
    // Get fresh default values with the latest next number
    const defaultValues = getDefaultValues();
    e.data = defaultValues;
    // Refresh the next number immediately after initialization
    refreshNextNumber();
  }, [getDefaultValues, refreshNextNumber]);

  const handleGridInitialized = useCallback((e: any) => {
    console.log('Client grid initialized');
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
