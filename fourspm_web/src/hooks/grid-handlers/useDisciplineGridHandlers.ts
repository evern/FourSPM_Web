import { useCallback } from 'react';
import { DISCIPLINES_ENDPOINT } from '@/config/api-endpoints';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { useDisciplines } from '@/contexts/disciplines/disciplines-context';

/**
 * Hook for discipline grid event handlers
 * Follows the Reference Data Implementation Doctrine
 * Uses createGridOperationHook factory for consistency
 */
export function useDisciplineGridHandlers({
  acquireToken,
}: {
  acquireToken?: () => Promise<string | null>;
}) {
  // Get the disciplines context for error reporting, cache invalidation, and business logic
  const { setError, invalidateAllLookups, validationRules, getDefaultValues } = useDisciplines();
  
  // Use the grid operation hook factory with Discipline-specific configuration
  const gridOperations = createGridOperationHook({
    endpoint: DISCIPLINES_ENDPOINT,
    validationRules: validationRules,
    
    // Error handlers
    onUpdateError: (error) => {
      console.error('Failed to update discipline:', error);
      setError('Failed to update discipline: ' + error.message);
    },
    onDeleteError: (error) => {
      console.error('Failed to delete discipline:', error);
      setError('Failed to delete discipline: ' + error.message);
    },
    onInsertError: (error) => {
      console.error('Failed to create discipline:', error);
      setError('Failed to create discipline: ' + error.message);
    },
    // These empty handlers are required for the hook to function properly
    onUpdateSuccess: () => {},
    onDeleteSuccess: () => {},
    onInsertSuccess: () => {},
    invalidateCache: invalidateAllLookups,
    defaultValues: getDefaultValues(),
    acquireToken
  });
  
  // Extract all the handlers from the grid operations hook except handleInitNewRow
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
  } = gridOperations;
  
  // Custom implementation of handleInitNewRow to ensure we get the latest default values
  const handleInitNewRow = useCallback((e: any) => {
    // Get fresh default values
    const defaultValues = getDefaultValues();
    e.data = defaultValues;
  }, [getDefaultValues]);
  
  // Handle grid initialization
  const handleGridInitialized = useCallback((e: any) => {
    console.log('Discipline grid initialized');
  }, []);
  
  // Return all handlers for use in the component
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  };
}
