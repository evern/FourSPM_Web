import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { VariationsContextType, EditorEvent, InitNewRowEvent } from './variations-types';
import { variationsReducer, initialVariationsState } from './variations-reducer';
import { Variation } from '../../types/odata-types';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { useAuth } from '../auth';
import { useMSALAuth } from '../msal-auth';
import { createVariation, updateVariation, deleteVariation, getProjectVariations, approveVariation, rejectVariation } from '../../adapters/variation.adapter';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { baseApiService } from '../../api/base-api.service';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { useParams } from 'react-router-dom';
import { useEntityValidator } from '../../hooks/utils/useEntityValidator';

/**
 * Default validation rules for variations
 */
export const DEFAULT_VARIATION_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'name', 
    required: true, 
    maxLength: 500, 
    errorText: 'Name is required and must be less than 500 characters' 
  },
  { 
    field: 'comments', 
    required: false, 
    maxLength: 1000, 
    errorText: 'Comments must be less than 1000 characters' 
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

// Create the context with a default undefined value
const VariationsContext = createContext<VariationsContextType | undefined>(undefined);

interface VariationsProviderProps {
  children: ReactNode;
}

export function VariationsProvider({ children }: VariationsProviderProps) {
  // Get route parameters for project ID
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  
  const [state, dispatch] = useReducer(variationsReducer, initialVariationsState);
  const { user } = useAuth();
  const msalAuth = useMSALAuth();
  
  // Set up the entity validator with variation-specific rules
  const {
    handleRowValidating: validatorHandleRowValidating,
    validateEntity,
    validateRowUpdate
  } = useEntityValidator({
    validationRules: DEFAULT_VARIATION_VALIDATION_RULES
  });
  
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
  
  // Token management
  const setToken = useCallback((token: string | null) => {
    if (isMountedRef.current) {
      dispatch({ type: 'SET_TOKEN', payload: token });
    }
  }, []);
  
  // Method to acquire a fresh token and update state
  const acquireToken = useCallback(async (): Promise<string | null> => {
    try {
      if (!isMountedRef.current) return null;
      
      const token = await msalAuth.acquireToken();
      if (token && isMountedRef.current) {
        setToken(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error acquiring token:', error);
      return null;
    }
  }, [msalAuth.acquireToken, setToken]);
  
  // Acquire token when context is initialized
  useEffect(() => {
    const getInitialToken = async () => {
      await acquireToken();
    };
    
    getInitialToken();
  }, [acquireToken]);
  
  // Fetch variations for a project
  const fetchVariations = useCallback(async (projectId: string) => {
    if (!state.token || !isMountedRef.current) return;
    
    try {
      dispatch({ type: 'FETCH_VARIATIONS_START' });
      // Token is now handled by MSAL internally
      const variations = await getProjectVariations(projectId);
      
      if (isMountedRef.current) {
        dispatch({ type: 'FETCH_VARIATIONS_SUCCESS', payload: variations });
      }
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ type: 'FETCH_VARIATIONS_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch variations' });
      }
    }
  }, [user?.token]);
  
  // Add a new variation
  const addVariation = useCallback(async (variation: Variation, skipStateUpdate = false): Promise<Variation> => {
    if (!user?.token || !isMountedRef.current) {
      throw new Error('Unable to create variation - user is not authenticated');
    }
    
    try {
      // Only dispatch start action if we're not skipping state updates
      if (!skipStateUpdate) {
        dispatch({ type: 'ADD_VARIATION_START', payload: variation });
      }
      
      // Always call the API - token is now handled by MSAL internally
      const newVariation = await createVariation(variation);
      
      // Only update state if we're not skipping state updates and component is still mounted
      if (!skipStateUpdate && isMountedRef.current) {
        dispatch({ type: 'ADD_VARIATION_SUCCESS', payload: newVariation });
      }
      
      return newVariation;
    } catch (error) {
      // Still report errors to state unless skipping state updates
      if (!skipStateUpdate && isMountedRef.current) {
        dispatch({ 
          type: 'ADD_VARIATION_ERROR', 
          payload: { 
            error: error instanceof Error ? error.message : 'Failed to create variation',
            variation
          } 
        });
      }
      throw error;
    }
  }, [user?.token]);
  
  // Update an existing variation
  const updateVariationFunc = useCallback(async (variation: Variation): Promise<Variation> => {
    if (!user?.token || !isMountedRef.current) {
      throw new Error('Unable to update variation - user is not authenticated');
    }
    
    try {
      dispatch({ type: 'UPDATE_VARIATION_START', payload: variation });
      // Token is now handled by MSAL internally
      await updateVariation(variation);
      
      if (isMountedRef.current) {
        dispatch({ type: 'UPDATE_VARIATION_SUCCESS', payload: variation });
      }
      return variation;
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ 
          type: 'UPDATE_VARIATION_ERROR', 
          payload: { 
            error: error instanceof Error ? error.message : 'Failed to update variation',
            variation
          } 
        });
      }
      throw error;
    }
  }, [user?.token]);
  
  // Delete a variation
  const deleteVariationFunc = useCallback(async (id: string): Promise<void> => {
    if (!user?.token || !isMountedRef.current) {
      throw new Error('Unable to delete variation - user is not authenticated');
    }
    
    try {
      dispatch({ type: 'DELETE_VARIATION_START', payload: id });
      // Token is now handled by MSAL internally
      await deleteVariation(id);
      
      if (isMountedRef.current) {
        dispatch({ type: 'DELETE_VARIATION_SUCCESS', payload: id });
      }
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ 
          type: 'DELETE_VARIATION_ERROR', 
          payload: { 
            error: error instanceof Error ? error.message : 'Failed to delete variation',
            id
          } 
        });
      }
      throw error;
    }
  }, [user?.token]);
  
  // Validation for variations
  // This implementation needs to be compatible with the VariationsContextType interface
  const validateVariation = useCallback((variation: Record<string, any>, rules: ValidationRule[] = DEFAULT_VARIATION_VALIDATION_RULES): { isValid: boolean; errors: Record<string, string> } => {
    if (!isMountedRef.current) return { isValid: false, errors: {} };
    
    const errors: Record<string, string[]> = {};
    
    // Process each validation rule
    rules.forEach(rule => {
      const fieldValue = variation[rule.field];
      
      if (rule.required && (!fieldValue || fieldValue === '')) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} is required`);
      }
      
      if (rule.maxLength && typeof fieldValue === 'string' && fieldValue.length > rule.maxLength) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} must be at most ${rule.maxLength} characters`);
      }
    });
    
    // Convert errors from string[] to a single string message
    const flatErrors: Record<string, string> = {};
    Object.keys(errors).forEach(key => {
      flatErrors[key] = errors[key][0]; // Just use the first error message
    });
    
    // Update validation errors state
    if (Object.keys(errors).length > 0) {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
      }
      return { isValid: false, errors: flatErrors };
    } else {
      if (isMountedRef.current) {
        dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
      }
      return { isValid: true, errors: {} };
    }
  }, []);
  
  // Editor-specific functions
  // Get default values for a new variation
  const getDefaultVariationValues = useCallback((projectId?: string): Partial<Variation> => {
    return {
      guid: uuidv4(),
      projectGuid: projectId || '',
      name: '',
      comments: ''
      // No created/createdBy fields as they should be handled by the server
    };
  }, []);
  
  // Handle editor field preparation
  const handleVariationEditorPreparing = useCallback((e: EditorEvent) => {
    const { dataField, editorOptions } = e;
    
    // Get original onValueChanged if it exists
    const originalSetValue = editorOptions.onValueChanged;
    
    // Add validation or custom behavior for specific fields
    if (dataField === 'name') {
      // Example: Add character limit warning
      editorOptions.maxLength = 100;
      editorOptions.onValueChanged = (args: any) => {
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // Could add custom validation or other behavior here
      };
    }
    
    // Custom handling for the comments field
    if (dataField === 'comments') {
      editorOptions.height = 80; // Make the comments field taller
    }
  }, []);
  
  // Handle new variation row initialization
  const handleVariationInitNewRow = useCallback((e: InitNewRowEvent) => {
    if (e?.data) {
      // Apply default variation values
      // We need to extract the projectId from the component or current filter
      const projectId = e.component?.option('defaultFilter')?.[0]?.[2] || '';
      const defaults = getDefaultVariationValues(projectId);
      Object.assign(e.data, defaults);
    }
  }, [getDefaultVariationValues]);
  
  // Cache invalidation function - invalidates all related lookup data
  // when variations data changes
  const invalidateAllLookups = useCallback(() => {
    // Invalidate any queries that might use variations as reference data
    queryClient.invalidateQueries({ queryKey: ['variations'] });
    queryClient.invalidateQueries({ queryKey: ['lookup'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
    
    console.log('Invalidated all lookup data after variation change');
  }, [queryClient]);
  
  // Handle row validating - can be used directly by grid handlers
  const handleRowValidating = useCallback((e: any) => {
    validatorHandleRowValidating(e);
    
    // If validation failed, we need to cancel the operation
    if (e.isValid === false) {
      e.cancel = true;
    }
  }, [validatorHandleRowValidating]);
  
  // Handle row update validation - can be used by grid handlers
  const validateRowUpdating = useCallback((oldData: any, newData: any) => {
    return validateRowUpdate(oldData, newData);
  }, [validateRowUpdate]);
  
  // Change variation status (approve/reject)
  const changeVariationStatus = useCallback(async ({ variationId, approve, projectGuid, skipStateUpdate = false }: { variationId: string; approve: boolean; projectGuid: string; skipStateUpdate?: boolean }) => {
    if (!user?.token || !isMountedRef.current) {
      throw new Error('Unable to change variation status - user is not authenticated');
    }
    
    try {
      // Dispatch a status change start action only if not skipping state updates
      if (!skipStateUpdate) {
        dispatch({ 
          type: 'SET_PROCESSING', 
          payload: true 
        });
      }
      
      // Call the appropriate adapter method based on approve flag
      // Token is now handled by MSAL internally
      if (approve) {
        await approveVariation(variationId);
      } else {
        await rejectVariation(variationId);
      }
      
      // Dispatch success action if still mounted and not skipping state updates
      if (isMountedRef.current && !skipStateUpdate) {
        dispatch({ 
          type: 'SET_PROCESSING', 
          payload: false 
        });
      }
      
      // Invalidate caches to refresh data only if not skipping state updates
      if (!skipStateUpdate) {
        invalidateAllLookups();
      }
    } catch (error) {
      // Only update state if not skipping updates and component is still mounted
      if (isMountedRef.current && !skipStateUpdate) {
        dispatch({ 
          type: 'SET_EDITOR_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to change variation status'
        });
        dispatch({ 
          type: 'SET_PROCESSING', 
          payload: false 
        });
      }
      throw error;
    }
  }, [user?.token, invalidateAllLookups]);

  // Fetch project details - key addition to prevent flickering
  const { 
    data: project, 
    isLoading: projectLoading,
    error: projectError
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId && !!user?.token,
    refetchOnWindowFocus: true // Auto-refresh data when window regains focus
  });
  
  // Combine loading states for lookup data - used to prevent flickering
  const isLookupDataLoading = state.loading || projectLoading;
  
  // CRITICAL: Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    setToken,
    acquireToken,
    // Validation methods
    validateVariation,
    handleRowValidating,
    validateRowUpdating,
    // Data operations
    fetchVariations,
    addVariation,
    updateVariation: updateVariationFunc,
    deleteVariation: deleteVariationFunc,
    // Status change function
    changeVariationStatus,
    // Project data (for anti-flickering pattern)
    project,
    isLookupDataLoading,
    // Editor functions
    getDefaultVariationValues,
    handleVariationEditorPreparing,
    handleVariationInitNewRow,
    // Cache invalidation function
    invalidateAllLookups
  }), [
    state,
    // Validation method dependencies
    validateVariation,
    handleRowValidating,
    validateRowUpdating,
    // Data operation dependencies
    fetchVariations,
    addVariation,
    updateVariationFunc,
    deleteVariationFunc,
    // Status change dependency
    changeVariationStatus,
    // Project data dependencies
    project,
    isLookupDataLoading,
    // Editor dependencies
    getDefaultVariationValues,
    handleVariationEditorPreparing,
    handleVariationInitNewRow,
    // Cache invalidation dependency
    invalidateAllLookups
  ]);
  
  return (
    <VariationsContext.Provider value={contextValue}>
      {children}
    </VariationsContext.Provider>
  );
}

// Custom hook to use the variations context
export function useVariations(): VariationsContextType {
  const context = useContext(VariationsContext);
  if (context === undefined) {
    throw new Error('useVariations must be used within a VariationsProvider');
  }
  return context;
}
