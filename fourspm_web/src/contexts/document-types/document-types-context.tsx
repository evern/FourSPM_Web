import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { DocumentTypesContextType, DocumentTypesState } from './document-types-types';
import { documentTypesReducer, initialDocumentTypesState } from './document-types-reducer';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import { getToken } from '../../utils/token-store';

// Project details are now fetched using useProjectInfo hook

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
  // Extract project ID from URL params if available
  const { projectId } = useParams<{ projectId?: string }>();
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(documentTypesReducer, initialDocumentTypesState);
  
  // Get user from auth context
  const { user } = useAuth();
  
  // Get token directly from token-store
  const [token, setTokenState] = React.useState<string | null>(getToken());
  const [tokenLoading, setTokenLoading] = React.useState<boolean>(false);
  const [tokenError, setTokenError] = React.useState<string | null>(null);
  
  // Get the current token for API calls
  const userToken = token;
  
  // Token management function for updating state
  const setToken = useCallback((newToken: string | null) => {
    if (isMountedRef.current) {
      dispatch({ type: 'SET_TOKEN', payload: newToken });
      setTokenState(newToken);
    }
  }, []);
  
  // Initialize token directly from token-store
  useEffect(() => {
    if (isMountedRef.current) {
      const storedToken = getToken();
      setToken(storedToken);
    }
  }, [setToken]);
  
  // Track component mounted state to prevent updates after unmounting
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;
    
    // Clean up function to prevent state updates after unmounting
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Token loading is now handled directly in the effect above
  
  // Sync loading state to the context
  useEffect(() => {
    if (isMountedRef.current) {
      dispatch({ type: 'SET_LOADING', payload: tokenLoading });
    }
  }, [tokenLoading]);
  
  // Sync error state to the context
  useEffect(() => {
    if (isMountedRef.current && tokenError) {
      dispatch({ type: 'SET_ERROR', payload: tokenError });
    }
  }, [tokenError]);
  
  // Get React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // For Collection View Doctrine patterns, the ODataGrid handles data fetching directly
  // We provide minimal implementations to satisfy the interface
  const documentTypesLoading = false;
  const documentTypesError = null;
  
  // Use the useProjectInfo hook to fetch project details - no need for client expansion
  const {
    project,
    isLoading: projectLoading,
    error: projectError
  } = useProjectInfo(projectId, { expandClient: false });
  
  // Combine loading states for lookup data - used to prevent flickering
  const isLookupDataLoading = state.loading || projectLoading;
  
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
      // Token management is done via token-store directly
      // Other functions
      invalidateAllLookups,
      documentTypesLoading,
      documentTypesError,
      validationRules: DOCUMENT_TYPE_VALIDATION_RULES,
      getDefaultValues,
      // Project data for title display - anti-flickering pattern
      project: project || undefined, // Convert null to undefined to match interface
      projectId,
      isLookupDataLoading
    }),
    [state, invalidateAllLookups, documentTypesLoading, documentTypesError, getDefaultValues, project, projectId, isLookupDataLoading]
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
