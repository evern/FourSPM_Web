import React, { createContext, useCallback, useContext, useMemo, useReducer, useRef, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { DocumentTypesContextType, DocumentTypesState } from './document-types-types';
import { documentTypesReducer, initialDocumentTypesState } from './document-types-reducer';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { baseApiService } from '../../api/base-api.service';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';

/**
 * Fetch project details from the API with client data expanded
 * @param projectId Project ID to fetch details for
 */
const fetchProject = async (projectId: string) => {
  if (!projectId) return null;
  
  // Add $expand=client to ensure the client navigation property is included
  const response = await baseApiService.request(`${PROJECTS_ENDPOINT}(${projectId})?$expand=client`);
  const data = await response.json();
  return data;
};

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
  
  // Get auth context for token
  const { user } = useAuth();
  
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
  
  // Get React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // For Collection View Doctrine patterns, the ODataGrid handles data fetching directly
  // We provide minimal implementations to satisfy the interface
  const documentTypesLoading = false;
  const documentTypesError = null;
  
  // Fetch project details - key addition to prevent flickering
  const { 
    data: project, 
    isLoading: projectLoading,
    error: projectError
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId || ''),
    enabled: !!projectId && !!user?.token,
    refetchOnWindowFocus: true // Auto-refresh data when window regains focus
  });
  
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
      invalidateAllLookups,
      documentTypesLoading,
      documentTypesError,
      validationRules: DOCUMENT_TYPE_VALIDATION_RULES,
      getDefaultValues,
      // Project data for title display - anti-flickering pattern
      project,
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
