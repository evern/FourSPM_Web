import React, { createContext, useReducer, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';

import { Deliverable } from '../../types/odata-types';
import { VariationDeliverableUiStatus } from '../../types/app-types';
import { useProjectData } from '../../hooks/queries/useProjectData';
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import { useVariationInfo } from '../../hooks/utils/useVariationInfo';
import { useAuth } from '../auth';
import { useTokenAcquisition } from '../../hooks/use-token-acquisition';
import { useDeliverables, DEFAULT_DELIVERABLE_VALIDATION_RULES } from '../deliverables/deliverables-context';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { 
  getVariationDeliverables,
  addExistingDeliverableToVariation,
  addNewDeliverableToVariation,
  cancelDeliverableVariation
} from '../../adapters/variation-deliverable.adapter';

import {
  VariationDeliverablesContextProps,
  VariationDeliverablesProviderProps
} from './variation-deliverables-types';
import {
  initialVariationDeliverablesState,
  variationDeliverablesReducer
} from './variation-deliverables-reducer';

/**
 * Variation-specific validation rules
 * Extends the base deliverable validation rules with variation-specific validations
 */
export const VARIATION_DELIVERABLE_VALIDATION_RULES: ValidationRule[] = [
  ...DEFAULT_DELIVERABLE_VALIDATION_RULES.filter(rule => rule.field !== 'internalDocumentNumber'),
  {
    field: 'variationHours',
    pattern: /^\d*\.?\d*$/,
    errorText: 'Variation Hours must be a non-negative number'
  }
];

// Create context
const VariationDeliverablesContext = createContext<VariationDeliverablesContextProps | undefined>(undefined);

/**
 * Provider component for the variation deliverables context
 * Follows the Context + React Query pattern for clean separation of state management and UI
 */
export function VariationDeliverablesProvider({
  children,
  variationId: variationGuidProp,
  projectId: projectGuidProp
}: VariationDeliverablesProviderProps): React.ReactElement {
  // Get route parameters and authentication
  const params = useParams<{ variationId: string; projectId?: string }>();
  const variationId = variationGuidProp || params.variationId;
  const { user } = useAuth();
  
  // Track component mount state to prevent state updates after unmounting
  const isMountedRef = useRef(true);
  
  // Use the centralized token acquisition hook
  const { 
    token, 
    loading: tokenLoading = false, 
    error: tokenError, 
    acquireToken: acquireTokenFromHook 
  } = useTokenAcquisition();
  
  // Get the current token for API calls
  const userToken = token;
  
  // Set up mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(variationDeliverablesReducer, {
    ...initialVariationDeliverablesState
  });
  
  // Action creators
  const setLoading = useCallback((loading: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  const setLookupDataLoaded = useCallback((loaded: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOOKUP_DATA_LOADED', payload: loaded });
  }, []);
  
  // Token management function for backward compatibility
  const setToken = useCallback((token: string | null) => {
    // This is a no-op now as token is managed by useTokenAcquisition
    console.log('setToken called, but token is now managed by useTokenAcquisition');
  }, []);
  
  // Alias for backward compatibility
  const acquireToken = useCallback(async (): Promise<string | null> => {
    return userToken || null;
  }, [userToken]);
  
  // Step 1: Load variation using the existing hook
  const {
    variation,
    loading: variationLoading,
    error: variationError,
    projectGuid: variationProjectGuid
  } = useVariationInfo(variationId); // Token is now handled by MSAL internally
  
  // Determine which project ID to use (from variation or props)
  const projectGuid = variationProjectGuid || projectGuidProp;
  
  // Step 2: Load project using the existing hook
  const {
    project,
    isLoading: projectLoading,
    error: projectError
  } = useProjectInfo(projectGuid); // Token is now handled by MSAL internally
  
  // Step 3: Fetch reference data only when project data is available
  const { 
    areasDataSource, 
    disciplinesDataSource, 
    documentTypesDataSource, 
    isLoading: referenceDataLoading, 
    error: referenceDataError 
  } = useProjectData(projectGuid);
  
  // Combine loading states
  const isLookupDataLoading = variationLoading || projectLoading || referenceDataLoading;
  
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
  
  // Combine errors from different data sources and format them
  const error = processError(variationError || projectError || referenceDataError);
  
  // Update error in state if any
  useEffect(() => {
    if (error) {
      setError(error);
    }
  }, [error, setError]);
  
  // Update lookup data loaded flag when all data sources are loaded
  useEffect(() => {
    setLookupDataLoaded(!isLookupDataLoading);
    setLoading(isLookupDataLoading);
  }, [isLookupDataLoading, setLookupDataLoaded, setLoading]);
  
  // Get default values for a new deliverable
  const getDefaultDeliverableValues = useCallback((): Partial<Deliverable> => {
    return {
      guid: uuidv4(),
      projectGuid: projectGuid || '',  // We provide a default even if undefined
      departmentId: 'Design',
      deliverableTypeId: 'Deliverable',
      documentType: '',
      clientDocumentNumber: '',
      discipline: '',
      areaNumber: '',
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,
      totalCost: 0,
      variationGuid: variationId,
      uiStatus: 'Add' as VariationDeliverableUiStatus
    };
  }, [projectGuid, variationId]);
  
  // Get query client for cache invalidation
  const queryClient = useQueryClient();

  // Get deliverables context for shared functionality
  const deliverablesContext = useDeliverables();

  // CRUD Operations
  // 1. Fetch variation deliverables
  const fetchVariationDeliverables = useCallback(async () => {
    if (!variationId || !user?.token) {
      return;
    }
    
    try {
      dispatch({ type: 'FETCH_DELIVERABLES_START' });
      const loadedDeliverables = await getVariationDeliverables(variationId);
      dispatch({ type: 'FETCH_DELIVERABLES_SUCCESS', payload: loadedDeliverables });
    } catch (error) {
      const errorMessage = processError(error);
      dispatch({ type: 'FETCH_DELIVERABLES_ERROR', payload: errorMessage });
    }
  }, [variationId, user?.token, processError]);

  // 2. Add existing deliverable to variation
  /**
   * Add an existing deliverable to the variation
   * 
   * @param deliverable - The deliverable to add to the variation
   * @param skipStateUpdate - If true, prevents context state updates during the operation
   *                          Used by grid handlers to allow direct API interaction without
   *                          triggering context re-renders, which helps prevent UI flickering
   *                          while maintaining data consistency with React Query
   * @returns Promise<Deliverable> - The updated/created deliverable
   */
  const addExistingToVariation = useCallback(async (deliverable: Deliverable, skipStateUpdate = false): Promise<Deliverable> => {
    try {
      // Only update loading state if we're not skipping state updates
      // This prevents unnecessary context re-renders when called from grid handlers
      if (!skipStateUpdate) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }
      if (!skipStateUpdate) {
        dispatch({ type: 'ADD_DELIVERABLE_START', payload: deliverable });
      }
      
      // Prepare the deliverable for variation
      const variationDeliverable: Deliverable = {
        ...deliverable,
        guid: deliverable.guid || uuidv4(), // Only generate a new GUID if one doesn't exist
        variationGuid: variationId
      };
      
      const result = await addExistingDeliverableToVariation(variationDeliverable);
      
      // Only update the context state if we're not skipping updates
      if (!skipStateUpdate) {
        dispatch({ type: 'ADD_DELIVERABLE_SUCCESS', payload: result });
      }
      
      // Always invalidate queries regardless of skipStateUpdate
      // This ensures data consistency across the application
      queryClient.invalidateQueries({ queryKey: ['variation-deliverables', variationId] });
      
      return result;
    } catch (error) {
      const errorMessage = processError(error);
      dispatch({ 
        type: 'ADD_DELIVERABLE_ERROR', 
        payload: { 
          error: errorMessage, 
          deliverable 
        }
      });
      throw error;
    }
  }, [variationId, user?.token, processError, queryClient]);

  // 3. Add new deliverable to variation
  const addNewToVariation = useCallback(async (deliverable: Partial<Deliverable>): Promise<Deliverable> => {
    if (!user?.token) {
      throw new Error('User token is required');
    }
    
    // Validate the deliverable using the shared functionality
    const validationResult = deliverablesContext.validateDeliverable(deliverable);
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
      let updatedDeliverable = { ...deliverable };
      if (!deliverable.internalDocumentNumber && 
          deliverable.areaNumber && 
          deliverable.discipline && 
          deliverable.documentType) {
        try {
          const generatedNumber = await deliverablesContext.generateDocumentNumber(
            deliverable.deliverableTypeId || 'Deliverable',
            deliverable.areaNumber || '',
            deliverable.discipline || '',
            deliverable.documentType || '',
            undefined,
            true // This is a variation deliverable
          );
          
          if (generatedNumber) {
            updatedDeliverable.internalDocumentNumber = generatedNumber;
          }
        } catch (docNumError) {
          // Log but don't fail if we can't generate a document number
          console.warn('Could not generate document number:', docNumError);
        }
      }
      
      // Prepare for variation and set UI status
      updatedDeliverable = {
        ...updatedDeliverable,
        guid: updatedDeliverable.guid || uuidv4(),
        variationGuid: variationId,
        uiStatus: 'Add' as VariationDeliverableUiStatus,
        created: new Date(),
        createdBy: user.name || 'system'
      };
      
      const result = await addNewDeliverableToVariation(updatedDeliverable as Deliverable); // Token is now handled by MSAL internally
      dispatch({ type: 'ADD_DELIVERABLE_SUCCESS', payload: result });
      
      // Invalidate any relevant queries
      queryClient.invalidateQueries({ queryKey: ['variation-deliverables', variationId] });
      
      return result;
    } catch (error) {
      const errorMessage = processError(error);
      dispatch({ 
        type: 'ADD_DELIVERABLE_ERROR', 
        payload: { 
          error: errorMessage, 
          deliverable 
        }
      });
      throw error;
    }
  }, [variationId, user?.token, user?.name, deliverablesContext, processError, queryClient]);

  /**
   * Cancel a deliverable in a variation
   * 
   * @param originalDeliverableGuid - The original deliverable GUID to cancel
   * @param skipStateUpdate - If true, prevents context state updates to avoid UI flickering
   *                          Used by grid handlers to avoid unnecessary re-renders
   *                          while still updating the database and invalidating caches
   * @returns Promise with the result of the cancellation
   */
  const cancelDeliverable = useCallback(async (originalDeliverableGuid: string, skipStateUpdate = false): Promise<any> => {
    if (!user?.token || !variationId) {
      throw new Error('User token and variation ID are required');
    }
    
    try {
      // Only update context state if not skipping state updates
      if (!skipStateUpdate) {
        dispatch({ type: 'DELETE_DELIVERABLE_START', payload: originalDeliverableGuid });
      }
      
      // Always perform the API call
      const result = await cancelDeliverableVariation(originalDeliverableGuid, variationId);
      
      // Only update context state if not skipping state updates
      if (!skipStateUpdate) {
        dispatch({ type: 'DELETE_DELIVERABLE_SUCCESS', payload: originalDeliverableGuid });
      }
      
      // Always invalidate queries to maintain data consistency
      queryClient.invalidateQueries({ queryKey: ['variation-deliverables', variationId] });
      
      return result;
    } catch (error) {
      const errorMessage = processError(error);
      
      // Only update error state if not skipping state updates
      if (!skipStateUpdate) {
        dispatch({ 
          type: 'DELETE_DELIVERABLE_ERROR', 
          payload: { 
            error: errorMessage, 
            id: originalDeliverableGuid 
          }
        });
      }
      throw error;
    }
  }, [variationId, user?.token, processError, queryClient]);
  
  // Removed redundant cancelVariationDeliverable function - using cancelDeliverable directly
  
  // Enhanced function to handle updating a variation deliverable with business rules
  /**
   * Update a variation deliverable
   * 
   * @param data - The deliverable data to update
   * @param skipStateUpdate - If true, prevents context state updates to avoid UI flickering
   *                          Used by grid handlers to allow the grid to manage its own updates
   *                          without triggering unnecessary context re-renders
   *                          React Query cache invalidation still occurs to maintain data consistency
   * @returns Promise<boolean> - True if update was successful
   */
  const updateVariationDeliverable = useCallback(async (data: any, skipStateUpdate = false): Promise<boolean> => {
    // Handle Approved variations - prevent editing of approved deliverables
    if (data.variationStatus === 'Approved' || data.uiStatus === 'Approved') {
      // Cannot modify approved deliverables - this is a business rule
      return false;
    }
    
    try {
      // Use the base method to perform the actual update, passing the skipStateUpdate flag
      // When skipStateUpdate is true:
      // - The API call still happens and the database is updated
      // - React Query caches are still invalidated
      // - But the context state is not updated, preventing unnecessary re-renders
      await addExistingToVariation({
        ...data
      }, skipStateUpdate);
      
      return true;
    } catch (error) {
      console.error('Error updating variation deliverable:', error);
      throw error;
    }
  }, [addExistingToVariation]);
  
  /**
   * Add a new deliverable to the variation
   * 
   * @param data - The new deliverable data
   * @param skipStateUpdate - If true, bypasses context state updates to prevent UI flickering
   *                          When true, performs a direct API call instead of updating context state
   *                          This is crucial for grid operations to prevent double-rendering
   *                          and flickering issues while still maintaining data consistency
   * @returns Promise<boolean> - True if addition was successful
   */
  const addNewVariationDeliverable = useCallback(async (data: any, skipStateUpdate = false): Promise<boolean> => {
    try {
      // Apply additional business rules for new deliverables
      const deliverableToAdd = {
        ...getDefaultDeliverableValues(),
        ...data,
        projectGuid,
        uiStatus: 'Add'
      };
      
      // Call the appropriate method based on skipStateUpdate
      // When skipStateUpdate is true:
      // - Bypass the context state update flow
      // - Make a direct API call to the backend
      // - Let the grid handle its own refresh cycle
      // This prevents the simultaneous context update and grid refresh
      // that causes flickering in the UI
      if (skipStateUpdate && user?.token) {
        // Direct API call to prevent state updates but still create the entity
        const preparedDeliverable = {
          ...deliverableToAdd,
          guid: deliverableToAdd.guid || uuidv4(),
          variationGuid: variationId
        };
        await addNewDeliverableToVariation(preparedDeliverable as Deliverable); // Token is now handled by MSAL internally
        
        // Still invalidate queries to maintain data consistency
        queryClient.invalidateQueries({ queryKey: ['variation-deliverables', variationId] });
      } else {
        // Use the normal method which updates state
        await addNewToVariation(deliverableToAdd);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding new deliverable:', error);
      throw error;
    }
  }, [projectGuid, getDefaultDeliverableValues, addNewToVariation]);
  
  // Determine if a deliverable can be cancelled with business rules
  const canDeliverableBeCancelled = useCallback((deliverable: Deliverable): { canCancel: boolean; reason?: string } => {
    if (!deliverable) {
      return { canCancel: false, reason: 'Deliverable data not provided' };
    }
    
    // Check for approved status - cannot cancel approved deliverables
    if (deliverable.variationStatus === 'Approved' || deliverable.uiStatus as string === 'Approved') {
      // Extract variation name if available
      let variationName = 'an approved variation';
      if (deliverable.variation && deliverable.variation.name) {
        variationName = deliverable.variation.name;
      } else if (deliverable.variationName) {
        variationName = deliverable.variationName;
      }
      
      return { 
        canCancel: false, 
        reason: `This deliverable belongs to ${variationName} and cannot be cancelled.
        Please make changes to the original deliverable instead.` 
      };
    }
    
    // Determine message based on the current status
    let confirmMessage = '';
    if (deliverable.uiStatus === 'Add') {
      confirmMessage = 'Are you sure you want to remove this deliverable from the variation?';
    } else if (deliverable.uiStatus === 'Edit') {
      confirmMessage = 'Are you sure you want to discard your changes to this deliverable?';
    } else if (deliverable.variationStatus === 'UnapprovedCancellation') {
      confirmMessage = 'Are you sure you want to undo the cancellation of this deliverable?';
    } else {
      confirmMessage = 'Are you sure you want to cancel this deliverable?';
    }
    
    return { canCancel: true, reason: confirmMessage };
  }, []);

  // UI Status Management
  // Validate a variation deliverable based on validation rules
  const validateVariationDeliverable = useCallback((deliverable: Partial<Deliverable>) => {
    if (!deliverable) {
      return { isValid: false, errors: { '_general': ['Deliverable is undefined'] } };
    }

    const errors: Record<string, string[]> = {};
    let isValid = true;
    
    // Get UI status to determine validation rules
    const uiStatus = (deliverable.uiStatus as VariationDeliverableUiStatus) || 'Original';
    
    // For Original status, only validate variationHours if it was changed
    if (uiStatus === 'Original') {
      // Special validation for variation hours
      if ('variationHours' in deliverable) {
        const hours = deliverable.variationHours;
        if (hours !== undefined && (isNaN(Number(hours)) || Number(hours) < 0)) {
          errors['variationHours'] = ['Variation hours must be a non-negative number'];
          isValid = false;
        }
      }
      
      // Skip other validations for Original status
      return { isValid, errors };
    }
    
    // For other statuses, validate against all rules
    for (const rule of VARIATION_DELIVERABLE_VALIDATION_RULES) {
      const { field, required, pattern, errorText } = rule;
      const value = deliverable[field as keyof Deliverable];
      
      // Check required fields
      if (required && (value === undefined || value === null || value === '')) {
        if (!errors[field]) errors[field] = [];
        errors[field].push(`${field} is required`);
        isValid = false;
      }
      
      // Check pattern validation
      if (pattern && value !== undefined && value !== null && value !== '') {
        if (!pattern.test(String(value))) {
          if (!errors[field]) errors[field] = [];
          errors[field].push(errorText || `Invalid ${field} format`);
          isValid = false;
        }
      }
    }
    
    return { isValid, errors };
  }, []);

  // Determine if a field should be editable based on UI status
  const isFieldEditable = useCallback((deliverable: Partial<Deliverable>, fieldName: string): boolean => {
    const uiStatus = deliverable.uiStatus || 'View';
    
    // Fields that are never editable (readonly system fields)
    const neverEditableFields = ['guid', 'projectGuid', 'variationGuid', 'originalDeliverableGuid', 'created', 'createdBy'];
    if (neverEditableFields.includes(fieldName)) {
      return false;
    }
    
    // Special case for internal document number (only editable on Add)
    if (fieldName === 'internalDocumentNumber' && uiStatus !== 'Add') {
      return false;
    }
    
    // Status-based rules
    switch (uiStatus) {
      case 'Add':
      case 'Edit':
        return true;
      case 'Cancel':
      case 'View':
        return false;
      default:
        return false;
    }
  }, []);
  
  // Create stable state reference for context value memoization
  const stableState = useMemo(() => state, [state]);
  
  // Create context value with all functions and state
  const contextValue = useMemo(() => ({
    // State with token from the hook
    state: {
      ...stableState,
      token: userToken,
      loading: tokenLoading || stableState.loading,
      error: tokenError || stableState.error
    },
    
    // State management functions
    setLoading,
    setError,
    setLookupDataLoaded,
    
    // Token management
    setToken,
    acquireToken,
    
    // Field and validation utilities
    isFieldEditable,
    getDefaultDeliverableValues,
    validateVariationDeliverable,
    
    // CRUD operations
    fetchVariationDeliverables,
    addExistingToVariation,
    addNewToVariation,
    cancelDeliverable,
    
    // Enhanced operations with business rules
    canDeliverableBeCancelled,
    updateVariationDeliverable,
    addNewVariationDeliverable,
    
    // Reference data
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    
    // Entity data
    projectGuid,
    project,
    variation
  }), [
    // State and state setters
    stableState,
    userToken,
    tokenLoading,
    tokenError,
    setLoading,
    setError,
    setLookupDataLoaded,
    setToken,
    acquireToken,
    
    // Field and validation utilities
    isFieldEditable,
    getDefaultDeliverableValues,
    validateVariationDeliverable,
    
    // CRUD operations
    fetchVariationDeliverables,
    addExistingToVariation,
    addNewToVariation,
    cancelDeliverable,
    canDeliverableBeCancelled,
    updateVariationDeliverable,
    addNewVariationDeliverable,
    
    // Reference data
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    
    // Entity data
    projectGuid,
    project,
    variation
  ]);
  
  return (
    <VariationDeliverablesContext.Provider value={contextValue}>
      {children}
    </VariationDeliverablesContext.Provider>
  );
}

/**
 * Hook to access the variation deliverables context
 * Provides type safety and ensures the context is being used within its provider
 */
export function useVariationDeliverables(): VariationDeliverablesContextProps {
  const context = useContext(VariationDeliverablesContext);
  
  if (!context) {
    throw new Error('useVariationDeliverables must be used within a VariationDeliverablesProvider');
  }
  
  return context;
}