import React, { createContext, useReducer, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { deliverablesReducer, initialDeliverablesState } from './deliverables-reducer';
import { DeliverablesContextProps, DeliverablesProviderProps, ValidationResult } from './deliverables-types';
import { useProjectData } from '../../hooks/queries/useProjectData';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { baseApiService } from '../../api/base-api.service';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { useAuth } from '../auth';
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
  // Get route parameters and authentication
  const params = useParams<{ projectId: string }>();
  const projectId = projectIdProp || params.projectId;
  const { user } = useAuth();
  
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
        user?.token || '',
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
  }, [projectId, user?.token, processApiError, dispatch]);

  // Fetch all deliverables for a project
  const fetchDeliverables = useCallback(async (projectId: string) => {
    if (!projectId || !user?.token) {
      // Skip if no project ID or user token
      return;
    }

    dispatch({ type: 'FETCH_DELIVERABLES_START' });

    try {
      const loadedDeliverables = await getDeliverables(user.token, projectId);
      
      // Convert the adapter Deliverable type to the odata-types Deliverable type
      // by ensuring numeric fields are treated as strings to match odata-types
      const convertedDeliverables = loadedDeliverables.map(deliverable => ({
        ...deliverable,
        deliverableTypeId: String(deliverable.deliverableTypeId), // Convert number to string
        variationStatus: deliverable.variationStatus !== undefined
          ? String(deliverable.variationStatus) // Convert number to string if present
          : undefined
      }));
      
      // Update state with fetched deliverables
      dispatch({ 
        type: 'FETCH_DELIVERABLES_SUCCESS', 
        payload: convertedDeliverables 
      });
    } catch (error) {
      // Process error using the standard error handling function
      const errorMessage = processApiError(error);
      dispatch({ type: 'FETCH_DELIVERABLES_ERROR', payload: errorMessage });
    }
  }, [dispatch, user, processApiError]);
  
  /**
   * Add a new deliverable with validation
   * @param deliverable The deliverable to add
   * @param isVariation Whether this is a variation deliverable
   * @returns The newly created deliverable
   */
  const addDeliverable = useCallback(async (
    deliverable: Partial<Deliverable>,
    isVariation: boolean = false
  ): Promise<Deliverable> => {
    if (!user?.token) {
      throw new Error('User token is required');
    }
    
    // Validate the deliverable before saving
    const validationResult = validateDeliverable(deliverable as Deliverable);
    if (!validationResult.isValid) {
      const errorMessage = Object.values(validationResult.errors)
        .flat()
        .join(', ');
      dispatch({ 
        type: 'ADD_DELIVERABLE_ERROR', 
        payload: { 
          error: errorMessage, 
          deliverable 
        }
      });
      throw new Error(errorMessage);
    }
    
    try {
      dispatch({ type: 'ADD_DELIVERABLE_START', payload: deliverable });
      
      // If the deliverable doesn't have a document number, try to generate one
      if (!deliverable.internalDocumentNumber && 
          deliverable.areaNumber && 
          deliverable.discipline && 
          deliverable.documentType) {
        const generatedNumber = await generateDocumentNumber(
          deliverable.deliverableTypeId || 'Deliverable',
          deliverable.areaNumber,
          deliverable.discipline,
          deliverable.documentType,
          undefined,
          isVariation
        );
        deliverable.internalDocumentNumber = generatedNumber;
      }
      
      // In a real implementation, you would call an adapter method like:
      // const result = await createDeliverable(deliverable, user.token);
      
      // For now, we'll simulate a successful creation by generating a new GUID and adding timestamps
      const newDeliverable = {
        ...deliverable,
        guid: deliverable.guid || uuidv4(), // Use provided GUID or generate a new one
        created: new Date(),
        createdBy: user.name || 'system'
      };
      
      // Convert numeric types to string to match odata-types
      const convertedDeliverable = {
        ...newDeliverable,
        deliverableTypeId: String(newDeliverable.deliverableTypeId),
        variationStatus: newDeliverable.variationStatus !== undefined 
          ? String(newDeliverable.variationStatus) 
          : undefined
      } as Deliverable;
      
      dispatch({ type: 'ADD_DELIVERABLE_SUCCESS', payload: convertedDeliverable });
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
      
      return convertedDeliverable;
    } catch (error) {
      const errorMessage = processApiError(error);
      dispatch({ 
        type: 'ADD_DELIVERABLE_ERROR', 
        payload: { 
          error: errorMessage, 
          deliverable 
        }
      });
      throw error;
    }
  }, [user?.token, validateDeliverable, generateDocumentNumber, dispatch, processApiError, queryClient, projectId]);
  
  /**
   * Update an existing deliverable with validation
   * @param deliverable The deliverable to update
   * @param isVariation Whether this is a variation deliverable
   * @returns The updated deliverable
   */
  const updateDeliverable = useCallback(async (
    deliverable: Deliverable,
    isVariation: boolean = false
  ): Promise<Deliverable> => {
    if (!user?.token) {
      throw new Error('User token is required');
    }
    
    // First validate the deliverable
    const validationResult = validateDeliverable(deliverable);
    if (!validationResult.isValid) {
      const errorMessage = Object.values(validationResult.errors)
        .flat()
        .join(', ');
      dispatch({ 
        type: 'UPDATE_DELIVERABLE_ERROR', 
        payload: { 
          error: errorMessage, 
          deliverable 
        }
      });
      throw new Error(errorMessage);
    }

    try {
      dispatch({ type: 'UPDATE_DELIVERABLE_START', payload: deliverable });
      
      // If fields that affect document number have changed, regenerate document number
      const needsDocumentNumberUpdate = 
        deliverable.areaNumber !== undefined && 
        deliverable.discipline !== undefined && 
        deliverable.documentType !== undefined;

      if (needsDocumentNumberUpdate) {
        // Check if we need to update the document number
        try {
          const suggestedNumber = await generateDocumentNumber(
            deliverable.deliverableTypeId || '',
            deliverable.areaNumber || '',
            deliverable.discipline || '',
            deliverable.documentType || '',
            deliverable.guid || '',
            isVariation
          );
          
          // Only update if it's different
          if (suggestedNumber && suggestedNumber !== deliverable.internalDocumentNumber) {
            deliverable.internalDocumentNumber = suggestedNumber;
          }
        } catch (docNumError) {
          // Log but don't fail the update if we can't get a document number
          console.warn('Could not update document number during update:', docNumError);
        }
      }
      
      // In a real implementation, you would call an adapter method like:
      // const result = await updateDeliverableApi(deliverable, user.token);
      
      // For this simulation, we'll just add updated timestamp
      const updatedDeliverable = {
        ...deliverable,
        updated: new Date(),
        updatedBy: user.name || 'system'
      };
      
      // Convert numeric types to string to match odata-types
      const convertedDeliverable = {
        ...updatedDeliverable,
        deliverableTypeId: String(updatedDeliverable.deliverableTypeId),
        variationStatus: updatedDeliverable.variationStatus !== undefined 
          ? String(updatedDeliverable.variationStatus) 
          : undefined
      };
      
      dispatch({ type: 'UPDATE_DELIVERABLE_SUCCESS', payload: convertedDeliverable });
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
      
      return convertedDeliverable;
    } catch (error) {
      const errorMessage = processApiError(error);
      dispatch({ 
        type: 'UPDATE_DELIVERABLE_ERROR', 
        payload: { 
          error: errorMessage,
          deliverable
        } 
      });
      throw error;
    }
  }, [user, user?.name, dispatch, validateDeliverable, generateDocumentNumber, processApiError, queryClient, projectId]);
  
  /**
   * Delete a deliverable with confirmation and error handling
   * @param id The GUID of the deliverable to delete
   * @returns Promise resolving when delete is complete
   */
  const deleteDeliverable = useCallback(async (id: string): Promise<void> => {
    if (!user?.token) {
      throw new Error('User token is required');
    }
    
    if (!id) {
      throw new Error('Deliverable ID is required for deletion');
    }
    
    try {
      dispatch({ type: 'DELETE_DELIVERABLE_START', payload: id });
      
      // In a real implementation, you would call an adapter method like:
      // await deleteDeliverableApi(id, user.token);
      
      // For simulation, we'll just dispatch the success action
      // This would normally happen after the API call succeeds
      
      dispatch({ type: 'DELETE_DELIVERABLE_SUCCESS', payload: id });
      
      // Invalidate any relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
      
      // Return void to maintain Promise<void> return type
      return;
    } catch (error) {
      const errorMessage = processApiError(error);
      dispatch({ 
        type: 'DELETE_DELIVERABLE_ERROR', 
        payload: { 
          error: errorMessage,
          id
        } 
      });
      throw error;
    }
  }, [user, dispatch, processApiError, queryClient, projectId]);

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
  
  // Combine loading states for lookup data
  const isLookupDataLoading = referenceDataLoading || projectLoading;
  
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
  
  // Fetch deliverables when project ID is available
  useEffect(() => {
    if (projectId && user?.token) {
      fetchDeliverables(projectId);
    }
  }, [projectId, user?.token, fetchDeliverables]);
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State
    state,
    
    // CRUD operations
    validateDeliverable,
    fetchDeliverables,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    
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
    fetchDeliverables,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
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
