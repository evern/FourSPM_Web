import React, { createContext, useReducer, useContext, useMemo, useCallback, useRef, useEffect } from 'react';
import { DeliverableProgressContextType, ValidationResult } from '../../contexts/deliverable-progress/deliverable-progress-types';
import { usePeriodManager } from '../../hooks/utils/usePeriodManager';
import { useDeliverableGateDataProvider } from '../../hooks/data-providers/useDeliverableGateDataProvider';
import { deliverableProgressReducer } from './deliverable-progress-reducer';
import { handleProgressUpdate } from '../../adapters/progress.adapter';
import { updateDeliverableGate } from '../../adapters/deliverable.adapter';
import { compareGuids } from '../../utils/guid-utils';
import { useTokenAcquisition } from '../../hooks/use-token-acquisition';
import { useQuery } from '@tanstack/react-query';
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

// Create a context with a default undefined value
const DeliverableProgressContext = createContext<DeliverableProgressContextType | undefined>(undefined);

// Context provider component
export interface DeliverableProgressProviderProps {
  children: React.ReactNode;
  projectId: string;
  initialPeriod?: number;
  startDate?: string;
}

export function DeliverableProgressProvider({ 
  children, 
  projectId, 
  initialPeriod = 0, 
  startDate = undefined 
}: DeliverableProgressProviderProps): React.ReactElement {
  // Initialize state with reducer - without period management which is now handled by usePeriodManager
  const [state, dispatch] = useReducer(deliverableProgressReducer, {
    loading: false,
    error: null,
    token: null
  });
  
  // Use the centralized token acquisition hook
  const { 
    token, 
    loading: tokenLoading, 
    error: tokenError, 
    acquireToken 
  } = useTokenAcquisition();
  
  // MSAL token management - keep for backward compatibility
  const setToken = useCallback((token: string | null) => {
    dispatch({ type: 'SET_TOKEN', payload: token });
  }, []);
  
  // Update local state when token changes from the hook
  useEffect(() => {
    setToken(token);
    if (tokenError) {
      dispatch({ type: 'SET_ERROR', payload: tokenError });
    }
    if (tokenLoading) {
      dispatch({ type: 'SET_LOADING', payload: tokenLoading });
    }
  }, [token, tokenError, tokenLoading, setToken]);
  
  // Get the current token for API calls
  const userToken = token;
  
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

  // Use the period manager with provided initial values from props
  // This ensures the context uses the same period state that the component receives
  const periodManager = usePeriodManager(initialPeriod, startDate);

  // Get deliverable gates data using the data provider hook
  // This follows the Collection View Doctrine by centralizing reference data in the context
  const { 
    deliverableGates,
    isLoading: isGatesLoading,
    error: gatesError 
  } = useDeliverableGateDataProvider();

  // Pass-through to the period manager for consistency
  const { selectedPeriod } = periodManager;

  /**
   * Validates that progress percentage doesn't exceed gate maximum
   * @param e Validation event with row data
   * @returns true if valid, false if invalid
   */
  const validateGatePercentage = useCallback((e: any): boolean => {
    if (e.newData.cumulativeEarntPercentage !== undefined) {
      // Get the new percentage value
      const newPercentage = e.newData.cumulativeEarntPercentage;
      
      // Get the current gate - check newData first in case the gate is being changed
      const gateGuid = e.newData.deliverableGateGuid !== undefined 
        ? e.newData.deliverableGateGuid 
        : e.oldData.deliverableGateGuid;
        
      const currentGate = deliverableGates.find(gate => 
        compareGuids(gate.guid, gateGuid)
      );
      
      // Validate against gate max percentage
      if (currentGate && newPercentage > currentGate.maxPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot exceed gate maximum of ${(currentGate.maxPercentage * 100).toFixed(0)}%`;
        return false;
      }
      
      // Use backend-provided values for previous and future period percentages
      const previousPeriodEarntPercentage = e.oldData.previousPeriodEarntPercentage || 0;
      const futurePeriodEarntPercentage = e.oldData.futurePeriodEarntPercentage || 0;
      
      // Validate that percentage doesn't decrease below previous period percentage
      if (newPercentage < previousPeriodEarntPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot be less than what's already reported in previous periods (${(previousPeriodEarntPercentage * 100).toFixed(0)}%)`;
        return false;
      }
      
      // Validate that percentage doesn't exceed future period percentage
      if (newPercentage + futurePeriodEarntPercentage > 1.0) {
        e.isValid = false;
        e.errorText = `Combined percentage with future periods cannot exceed 100% (current: ${(newPercentage * 100).toFixed(0)}%, future: ${(futurePeriodEarntPercentage * 100).toFixed(0)}%)`;
        return false;
      }
    }
    
    return true;
  }, [deliverableGates]);
  
  /**
   * Validates a deliverable progress entry
   * @param progress The progress data to validate
   * @returns Validation result
   */
  const validateProgress = useCallback((progress: Record<string, any>): ValidationResult => {
    // Check basic percentage range
    if (progress.cumulativeEarntPercentage !== undefined) {
      if (progress.cumulativeEarntPercentage < 0 || progress.cumulativeEarntPercentage > 1) {
        return {
          isValid: false,
          errorMessage: 'Percentage must be between 0% and 100%',
          errorField: 'cumulativeEarntPercentage'
        };
      }
      
      // Check gate maximum percentage
      if (progress.deliverableGateGuid) {
        const currentGate = deliverableGates.find(gate => 
          compareGuids(gate.guid, progress.deliverableGateGuid)
        );
        
        if (currentGate && progress.cumulativeEarntPercentage > currentGate.maxPercentage) {
          return {
            isValid: false,
            errorMessage: `Percentage cannot exceed gate maximum of ${(currentGate.maxPercentage * 100).toFixed(0)}%`,
            errorField: 'cumulativeEarntPercentage'
          };
        }
      }
      
      // Check previous and future period constraints
      if (progress.previousPeriodEarntPercentage !== undefined && 
          progress.cumulativeEarntPercentage < progress.previousPeriodEarntPercentage) {
        return {
          isValid: false,
          errorMessage: `Percentage cannot be less than what's already reported in previous periods (${(progress.previousPeriodEarntPercentage * 100).toFixed(0)}%)`,
          errorField: 'cumulativeEarntPercentage'
        };
      }
      
      if (progress.futurePeriodEarntPercentage !== undefined && 
          progress.cumulativeEarntPercentage + progress.futurePeriodEarntPercentage > 1.0) {
        return {
          isValid: false,
          errorMessage: `Combined percentage with future periods cannot exceed 100% (current: ${(progress.cumulativeEarntPercentage * 100).toFixed(0)}%, future: ${(progress.futurePeriodEarntPercentage * 100).toFixed(0)}%)`,
          errorField: 'cumulativeEarntPercentage'
        };
      }
    }

    // All checks passed
    return { isValid: true };
  }, [deliverableGates]);

  /**
   * Process a single progress update, handling both gate changes and percentage updates
   * @param key The deliverable GUID
   * @param newData The new data to apply
   * @param oldData The original data before changes
   * @returns Promise that resolves when the update is complete
   */
  const processProgressUpdate = useCallback(async (
    key: string,
    newData: any,
    oldData: any
  ): Promise<void> => {
    // First, check if gate update is needed
    if (newData.deliverableGateGuid !== undefined && 
        oldData.deliverableGateGuid !== newData.deliverableGateGuid) {
      // Update the deliverable gate in the backend using the adapter directly
      // Token is now handled by MSAL internally
      await updateDeliverableGate(key, newData.deliverableGateGuid);
    }
    
    // Next, check if progress update is needed
    if (newData.cumulativeEarntPercentage !== undefined) {
      // Call the progress service to update the backend
      await handleProgressUpdate(
        key,
        { 
          cumulativeEarntPercentage: newData.cumulativeEarntPercentage,
          totalHours: newData.totalHours || 0
        },
        selectedPeriod || 0, // Use the current period from context
        oldData,
        userToken || '' // Use the token from the hook
      );
    }
  }, [selectedPeriod, userToken]);

  // Fetch project details - key addition to prevent flickering
  const { 
    data: project, 
    isLoading: projectLoading,
    error: projectError
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId && !!userToken, // Use userToken from the hook
    refetchOnWindowFocus: true // Auto-refresh data when window regains focus
  });
  
  // Combine loading states for lookup data - used to prevent flickering
  const isLookupDataLoading = state.loading || projectLoading || isGatesLoading;

  // Create the context value with all necessary properties
  const contextValue = useMemo<DeliverableProgressContextType>(() => ({
    state: {
      ...state,
      loading: state.loading || isLookupDataLoading || tokenLoading,
      error: state.error || tokenError || null,
      token: token || state.token, // Prefer token from hook if available
    },
    setToken,
    acquireToken,
    setSelectedPeriod: periodManager.setSelectedPeriod,
    incrementPeriod: periodManager.incrementPeriod,
    decrementPeriod: periodManager.decrementPeriod,
    selectedPeriod: periodManager.selectedPeriod,
    progressDate: periodManager.progressDate,
    projectId,
    project: project, // Using the project from the useQuery hook
    isLookupDataLoading: isLookupDataLoading || tokenLoading,
    deliverableGates,
    isGatesLoading,
    gatesError: gatesError || tokenError || null,
    validateGatePercentage,
    validateProgress,
    processProgressUpdate, // Using the processProgressUpdate function defined above
  }), [
    state,
    setToken,
    acquireToken,
    periodManager.setSelectedPeriod,
    periodManager.incrementPeriod,
    periodManager.decrementPeriod,
    periodManager.selectedPeriod,
    periodManager.progressDate,
    projectId,
    project,
    isLookupDataLoading,
    deliverableGates,
    isGatesLoading,
    gatesError,
    validateGatePercentage,
    validateProgress,
    processProgressUpdate,
    token,
    tokenLoading,
    tokenError,
  ]);

  return (
    <DeliverableProgressContext.Provider value={contextValue}>
      {children}
    </DeliverableProgressContext.Provider>
  );
}

// Custom hook to use the context
export function useDeliverableProgress(): DeliverableProgressContextType {
  const context = useContext(DeliverableProgressContext);
  if (context === undefined) {
    throw new Error('useDeliverableProgress must be used within a DeliverableProgressProvider');
  }
  return context;
}
