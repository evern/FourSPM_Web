import React, { createContext, useReducer, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { deliverablesReducer, initialDeliverablesState } from './deliverables-reducer';
import { DeliverablesContextProps, DeliverablesProviderProps, ValidationResult } from './deliverables-types';
import { useProjectData } from '../../hooks/queries/useProjectData';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { baseApiService } from '../../api/base-api.service';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { useTokenAcquisition } from '../../hooks/use-token-acquisition';
import { Deliverable } from '../../types/odata-types';
import { getDeliverables, getSuggestedDocumentNumber } from '../../adapters/deliverable.adapter';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default validation rules for deliverables
 * These rules are used both for form validation and grid validation
 */
export const DEFAULT_DELIVERABLE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'areaNumber', 
    required: true, 
    maxLength: 2,
    pattern: /^[0-9][0-9]$/,
    errorText: 'Area Number must be exactly 2 digits (00-99)' 
  },
  { 
    field: 'discipline', 
    required: true,
    errorText: 'Discipline is required' 
  },
  { 
    field: 'documentType', 
    required: true,
    errorText: 'Document Type is required' 
  },
  { 
    field: 'deliverableTypeId', 
    required: true, 
    errorText: 'Deliverable Type is required'
  },
  { 
    field: 'documentTitle', 
    required: true, 
    maxLength: 500,
    errorText: 'Document Title is required and must be at most 500 characters' 
  },
  {
    field: 'internalDocumentNumber',
    required: true,
    errorText: 'Document Number is required'
  }
];

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

// Create the context
const DeliverablesContext = createContext<DeliverablesContextProps | undefined>(undefined);

/**
 * Provider component for the deliverables context
 * Follows the Context + React Query pattern for clean separation of state management and UI
 * Implements a sequential loading pattern for better performance
 */
export function DeliverablesProvider({ children, projectId: projectIdProp }: DeliverablesProviderProps): React.ReactElement {
  // Get route parameters
  const params = useParams<{ projectId: string }>();
  const projectId = projectIdProp || params.projectId;
  
  // Use the centralized token acquisition hook
  const { 
    token, 
    loading: tokenLoading = false, 
    error: tokenError, 
    acquireToken 
  } = useTokenAcquisition();
  
  // Get the current token for API calls
  const userToken = token;
  
  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // CRITICAL: Track the component mount state to prevent state updates after unmounting
  const isMountedRef = React.useRef(true);
  
  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;
    
    // Clean up function to prevent state updates after unmounting
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(deliverablesReducer, initialDeliverablesState);
  
  // Action creators for legacy support
  const setLoading = useCallback((loading: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  // Token management functions - kept for backward compatibility
  const setToken = useCallback((token: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_TOKEN', payload: token });
  }, []);
  
  // Update local state when token changes from the hook
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Update token in local state
    setToken(userToken);
    
    // Update loading and error states
    dispatch({ type: 'SET_LOADING', payload: tokenLoading });
    
    if (tokenError) {
      dispatch({ type: 'SET_ERROR', payload: tokenError });
    }
  }, [userToken, tokenLoading, tokenError, setToken]);
  
  // Alias for backward compatibility
  const acquireTokenWithState = useCallback(async (): Promise<string | null> => {
    return userToken || null;
  }, [userToken]);
  
  // setProjectGuid function removed - project ID now passed explicitly to functions
  
  const setLookupDataLoaded = useCallback((loaded: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOOKUP_DATA_LOADED', payload: loaded });
  }, []);

  /**
   * Process API errors to standardize error messages
   */
  const processApiError = useCallback((error: any): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }, []);

  /**
   * Validates a deliverable against validation rules
   * @param deliverable The deliverable object to validate
   * @param rules Additional validation rules to apply (combined with defaults)
   * @returns Validation result with isValid flag and errors record
   */
  const validateDeliverable = useCallback((deliverable: Partial<Deliverable>, rules: ValidationRule[] = []): ValidationResult => {
    // Use the centralized validation rules
    
    // First combine our standardized rules with any custom rules
    let allRules = [...DEFAULT_DELIVERABLE_VALIDATION_RULES, ...rules];
    
    // Handle project GUID validation differently: if the deliverable doesn't have it but we have a projectId parameter,
    // we'll either skip this validation or inject the projectId as needed
    if (!deliverable.projectGuid && projectId) {
      // For a record being validated before sending to API, we'd want to add the projectId
      // For mere UI validation, we can skip this validation since the projectId will be added later
      // Currently we just skip validation - the handler functions add projectId appropriately
    } else if (!deliverable.projectGuid) {
      // Only add the projectGuid validation if the deliverable doesn't include it and we don't have a project context
      const projectRule: ValidationRule = { field: 'projectGuid', required: true, errorText: 'Project is required' };
      allRules = [projectRule, ...allRules];
    }
    
    // Validate against all rules
    const errors: Record<string, string[]> = {};
    
    allRules.forEach((rule) => {
      const fieldValue = (deliverable as any)[rule.field];
      
      // Required field validation
      if (rule.required && (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === ''))) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} is required`);
      }
      
      // Max length validation for string fields
      if (rule.maxLength && typeof fieldValue === 'string' && fieldValue.length > rule.maxLength) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} must be at most ${rule.maxLength} characters`);
      }
      
      // Pattern validation for regex patterns
      if (rule.pattern && typeof fieldValue === 'string' && !rule.pattern.test(fieldValue)) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} has an invalid format`);
      }
    });
    
    // Return the validation result
    const isValid = Object.keys(errors).length === 0;
    
    // Update validation state in the reducer
    if (isMountedRef.current) {
      if (!isValid) {
        dispatch({ 
          type: 'SET_VALIDATION_ERRORS', 
          payload: errors 
        });
      } else {
        dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
      }
    }
    
    return {
      isValid,
      errors
    };
  }, [dispatch, isMountedRef]);

  /**
   * Initializes a new deliverable with default values
   * @param projectId The project GUID for the deliverable
   * @param project Optional project data for enhanced initialization
   * @param isVariation Whether this is a variation deliverable
   * @returns A new deliverable object with default values
   */
  const initializeDeliverable = useCallback((
    projectId: string,
    project?: any,
    isVariation: boolean = false
  ): Partial<Deliverable> => {
    // Base default values all deliverables should have with proper types
    const defaultValues: Partial<Deliverable> = {
      // Core identifiers
      guid: uuidv4(),
      projectGuid: projectId,
      
      // Required string fields with default values
      departmentId: 'Design',
      deliverableTypeId: 'Deliverable', // Hardcoded default deliverable type
      documentType: '',
      clientDocumentNumber: '',
      discipline: '',
      areaNumber: '',
      documentTitle: '',
      
      // Required numeric fields with default values
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,
      totalCost: 0
      // Note: created and createdBy are handled by the backend using session data
    };
    
    // Add project-related fields if available
    if (project) {
      // Extract client number if available
      if (project.client) {
        defaultValues.clientNumber = project.client.number || '';
      }
      
      // Extract project number if available
      if (project.projectNumber) {
        defaultValues.projectNumber = project.projectNumber || '';
      }
    }
    
    return defaultValues;
  }, [projectId]); // Adding projectId to satisfy the linter

  /**
   * Generates a document number based on deliverable details
   * @param deliverableTypeId The deliverable type ID
   * @param areaNumber The area number
   * @param discipline The discipline code
   * @param documentType The document type code
   * @param currentDeliverableGuid Optional existing deliverable GUID (for updates)
   * @param isVariation Whether this is a variation deliverable
   * @returns Promise resolving to the generated document number
   */
  const generateDocumentNumber = useCallback(async (
    deliverableTypeId: string | number,
    areaNumber: string, 
    discipline: string, 
    documentType: string,
    currentDeliverableGuid?: string,
    isVariation: boolean = false
  ): Promise<string> => {
    try {
      
      // Convert to string for consistency with API call
      const deliverableTypeIdStr = deliverableTypeId?.toString() || '';

      const suggestedNumber = await getSuggestedDocumentNumber(
        projectId,
        deliverableTypeIdStr,
        areaNumber, 
        discipline, 
        documentType,
        currentDeliverableGuid 
      );
      
      // If this is a variation deliverable, replace the numerical suffix with XXX
      if (isVariation && suggestedNumber) {
        // Find the last dash followed by numbers and replace with XXX
        return suggestedNumber.replace(/(-\d+)$/, '-XXX');
      }
      
      return suggestedNumber;
    } catch (error) {
      console.error('Error fetching suggested document number:', error);
      const errorMessage = processApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return '';
    }
  }, [projectId, processApiError, dispatch]);

  // Use React Query to fetch reference data
  const { 
    areasDataSource, 
    disciplinesDataSource, 
    documentTypesDataSource,
    isLoading: referenceDataLoading, 
    error: referenceDataError 
  } = useProjectData(projectId);
  
  // Fetch project details
  const { 
    data: project, 
    isLoading: projectLoading,
    error: projectError
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
    refetchOnWindowFocus: true // Auto-refresh data when window regains focus
  });
  
  // Cache invalidation function
  const invalidateAllLookups = useCallback(() => {
    // Invalidate any queries that might use deliverables as reference data
    queryClient.invalidateQueries({ queryKey: ['deliverables'] });
    queryClient.invalidateQueries({ queryKey: ['lookup'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
    
    console.log('Invalidated all lookup data after deliverable change');
  }, [queryClient]);
  
  // Combine loading states for lookup data and token
  const isLookupDataLoading = referenceDataLoading || projectLoading || tokenLoading;
  
  // Process and format errors from different data sources
  const processError = useCallback((error: any): string | null => {
    if (!error) return null;
    
    // Handle Axios errors
    if (error.response) {
      return `Server Error: ${error.response.status} - ${error.response.data?.message || error.message}`;
    }
    
    // Handle network errors
    if (error.request) {
      return `Network Error: Unable to connect to server. Please check your connection.`;
    }
    
    // Handle other errors
    return error.message || 'An unknown error occurred';
  }, []);
  
  // Combine errors from different data sources and format them - removing unused variable
  // Previously: const error = processError(referenceDataError || projectError);
  
  // Update lookup data loaded flag when all data sources are loaded
  useEffect(() => {
    if (isMountedRef.current) {
      setLookupDataLoaded(!isLookupDataLoading);
    }
  }, [isLookupDataLoading, setLookupDataLoaded]);
  
  // Fetch deliverables useEffect removed as ODataGrid loads data directly
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State
    state,
    
    // Token management
    setToken,
    acquireToken: acquireTokenWithState,
    
    // Validation
    validateDeliverable,
    
    // Document & Field Management
    initializeDeliverable,
    generateDocumentNumber,
    
    // Legacy actions
    setLoading,
    setError,
    // setProjectGuid removed
    setLookupDataLoaded,
    
    // Cache invalidation
    invalidateAllLookups,
    
    // Reference data
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    
    // Project data
    project
  }), [
    state, 
    validateDeliverable,
    initializeDeliverable,
    generateDocumentNumber,
    setLoading,
    setError,
    // setProjectGuid removed
    setLookupDataLoaded,
    invalidateAllLookups,
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    project
  ]);
  
  return (
    <DeliverablesContext.Provider value={contextValue}>
      {children}
    </DeliverablesContext.Provider>
  );
}

/**
 * Hook to access the deliverables context
 * Provides type safety and ensures the context is being used within its provider
 */
export function useDeliverables(): DeliverablesContextProps {
  const context = useContext(DeliverablesContext);
  
  if (!context) {
    throw new Error('useDeliverables must be used within a DeliverablesProvider');
  }
  
  return context;
}
