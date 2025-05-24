import { useCallback } from 'react';
import { useRoles } from '../../contexts/roles/roles-context';
import { EditorEvent, InitNewRowEvent } from '../../contexts/roles/roles-types';

/**
 * Hook for role grid handlers
 * 
 * Provides handlers for grid events that connect to the roles context
 */
export const useRoleGridHandlers = () => {
  const { 
    handleRowValidating: contextHandleRowValidating,
    handleRoleEditorPreparing: contextHandleEditorPreparing,
    handleRoleInitNewRow: contextHandleInitNewRow,
    invalidateAllLookups
  } = useRoles();

  // Row validation handler
  const handleRowValidating = useCallback((e: any) => {
    contextHandleRowValidating(e);
  }, [contextHandleRowValidating]);

  // Handle row inserting - invalidate caches after successful insert
  const handleRowInserting = useCallback((e: any) => {
    // The grid will handle the actual insertion through ODataStore
    // We just need to make sure caches are invalidated after
    const originalOnSuccess = e.component._options.onRowInserted;
    
    e.component._options.onRowInserted = (result: any) => {
      // Call the original success handler if it exists
      if (originalOnSuccess) {
        originalOnSuccess(result);
      }
      
      // Invalidate caches to refresh related data
      invalidateAllLookups();
    };
  }, [invalidateAllLookups]);

  // Handle row removing - invalidate caches after successful delete
  const handleRowRemoving = useCallback((e: any) => {
    // The grid will handle the actual deletion through ODataStore
    // We just need to make sure caches are invalidated after
    const originalOnSuccess = e.component._options.onRowRemoved;
    
    e.component._options.onRowRemoved = (result: any) => {
      // Call the original success handler if it exists
      if (originalOnSuccess) {
        originalOnSuccess(result);
      }
      
      // Invalidate caches to refresh related data
      invalidateAllLookups();
    };
  }, [invalidateAllLookups]);

  // Editor preparation handler
  const handleEditorPreparing = useCallback((e: EditorEvent) => {
    contextHandleEditorPreparing(e);
  }, [contextHandleEditorPreparing]);

  // New row initialization handler
  const handleInitNewRow = useCallback((e: InitNewRowEvent) => {
    contextHandleInitNewRow(e);
  }, [contextHandleInitNewRow]);

  return {
    handleRowValidating,
    handleRowInserting,
    handleRowRemoving,
    handleEditorPreparing,
    handleInitNewRow
  };
};
