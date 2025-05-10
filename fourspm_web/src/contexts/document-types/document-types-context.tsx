import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { DocumentTypesContextType, DocumentTypesState } from './document-types-types';
import { documentTypesReducer, initialDocumentTypesState } from './document-types-reducer';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default validation rules for document types
 */
export const DOCUMENT_TYPE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'code', 
    required: true, 
    errorText: 'Code is required' 
  },
  { 
    field: 'name', 
    required: true, 
    errorText: 'Name is required' 
  }
];

/**
 * Default values for new document type
 */
export const DEFAULT_DOCUMENT_TYPE_VALUES = {
  guid: uuidv4(),
  code: '',
  name: ''
};

/**
 * Function to get fresh default values (to ensure new UUID for each new document type)
 */
export const getDefaultDocumentTypeValues = () => {
  return {
    ...DEFAULT_DOCUMENT_TYPE_VALUES,
    guid: uuidv4()
  };
};

// Create context for document types
const DocumentTypesContext = createContext<DocumentTypesContextType | undefined>(undefined);

/**
 * Provider component for document types context
 */
export function DocumentTypesProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(documentTypesReducer, initialDocumentTypesState);
  
  // Get React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // For Collection View Doctrine patterns, the ODataGrid handles data fetching directly
  // We provide minimal implementations to satisfy the interface
  const documentTypesLoading = false;
  const documentTypesError = null;
  
  // Function to invalidate all lookup data caches when document types data changes
  const invalidateAllLookups = useCallback(() => {
    // Invalidate any queries that might use document types as reference data
    queryClient.invalidateQueries({ queryKey: ['documentTypes'] });
    queryClient.invalidateQueries({ queryKey: ['lookup'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
    
    console.log('Invalidated all lookup data after document types change');
  }, [queryClient]);
  
  // Function to get fresh default values each time
  const getDefaultValues = useCallback(() => {
    return getDefaultDocumentTypeValues();
  }, []);

  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      invalidateAllLookups,
      documentTypesLoading,
      documentTypesError,
      validationRules: DOCUMENT_TYPE_VALIDATION_RULES,
      getDefaultValues
    }),
    [state, invalidateAllLookups, documentTypesLoading, documentTypesError, getDefaultValues]
  );
  
  return (
    <DocumentTypesContext.Provider value={contextValue}>
      {children}
    </DocumentTypesContext.Provider>
  );
}

/**
 * Custom hook to use the document types context
 */
export function useDocumentTypes(): DocumentTypesContextType {
  const context = useContext(DocumentTypesContext);
  
  if (context === undefined) {
    throw new Error('useDocumentTypes must be used within a DocumentTypesProvider');
  }
  
  return context;
}
