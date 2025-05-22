import { useCallback } from 'react';
import { DOCUMENT_TYPES_ENDPOINT } from '@/config/api-endpoints';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { useDocumentTypes } from '@/contexts/document-types/document-types-context';
import { getToken } from '@/utils/token-store';

// Empty interface since we no longer need acquireToken parameter
interface UseDocumentTypeGridHandlersParams {
  // This can be extended with future parameters if needed
}

/**
 * Hook for handling document type grid operations
 */
export function useDocumentTypeGridHandlers({}: UseDocumentTypeGridHandlersParams = {}) {
  // Get context for error reporting, cache invalidation, and business logic
  const { state, invalidateAllLookups, validationRules, getDefaultValues } = useDocumentTypes();
  
  // Create grid operations handlers using the factory function
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow
  } = createGridOperationHook({
    endpoint: DOCUMENT_TYPES_ENDPOINT,
    validationRules,  // Use validation rules from context
    onUpdateError: (error) => {
      console.error('Document type update error:', error);
    },
    onDeleteError: (error) => {
      console.error('Document type delete error:', error);
    },
    invalidateCache: invalidateAllLookups,
    defaultValues: getDefaultValues()  // Use default values from context
  });
  
  // Handle grid initialization
  const handleGridInitialized = useCallback((e: any) => {
    // You can add any grid initialization logic here
    // For example, setting up grid events, toolbar customization, etc.
    console.log('Document types grid initialized');
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
