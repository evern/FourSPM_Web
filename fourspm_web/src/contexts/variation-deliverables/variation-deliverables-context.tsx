import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { confirm } from 'devextreme/ui/dialog';
import { useGridUtils } from '@/hooks/utils/useGridUtils';

import { Deliverable } from '@/types/odata-types';
import { VariationDeliverableUiStatus } from '@/types/app-types';
import { ALWAYS_READONLY_DELIVERABLE_FIELDS } from '@/hooks/grid-editors/useDeliverableGridEditor';
import { useVariationInfo } from '@/hooks/utils/useVariationInfo';

// Data providers have been moved to the component level for better optimization
// This follows the pattern from deliverables.tsx

import {
  VariationDeliverablesState,
  VariationDeliverablesAction,
  VariationDeliverablesContextProps,
  VariationDeliverablesProviderProps,
  VariationDeliverableParams,
  CancelDeliverableParams
} from './variation-deliverables-types';
import {
  initialVariationDeliverablesState,
  variationDeliverablesReducer
} from './variation-deliverables-reducer';

// Create context
const VariationDeliverablesContext = createContext<VariationDeliverablesContextProps | undefined>(undefined);

/**
 * Provider component for the variation deliverables context
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
  
  // Load variation info
  const { variation, projectGuid, loading: variationLoading, reload: reloadVariation } = 
    useVariationInfo(variationId, user?.token);
  
  // If variation is still loading, render a simple provider with loading state
  if (variationLoading) {
    return (
      <VariationDeliverablesContext.Provider value={{
        state: { loading: true, error: null, isReadOnly: true },
        // Minimal required implementations that won't be called while loading
        loadDeliverables: async () => {},
        // UI helper functions with minimal implementations
        isFieldEditable: () => false,
        getDefaultDeliverableValues: () => ({}),
        // Limited data available during loading
        projectGuid,
        project: null,
        variation: null
      }}>
        {children}
      </VariationDeliverablesContext.Provider>
    );
  }
  
  // Once variation is loaded, proceed with VariationDeliverablesContent which loads everything else
  return <VariationDeliverablesContent
    variationId={variationId}
    projectGuid={projectGuid}
    variation={variation}
    user={user}
  >
    {children}
  </VariationDeliverablesContent>;
}

/**
 * Internal component that loads lookup data and provides the full context implementation
 * Only rendered after variation data is successfully loaded
 */
function VariationDeliverablesContent({
  children,
  variationId,
  projectGuid,
  variation,
  user
}: {
  children: React.ReactNode;
  variationId: string;
  projectGuid: string;
  variation: any;
  user: any;
}): React.ReactElement {
  // Initialize state with reducer - this will contain application state
  const [state, dispatch] = useReducer(variationDeliverablesReducer, initialVariationDeliverablesState);
  

  // Set loading state
  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: isLoading });
  }, []);
  
  // Set error state
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  // Set read-only state
  const setReadOnly = useCallback((isReadOnly: boolean) => {
    dispatch({ type: 'SET_READ_ONLY', payload: isReadOnly });
  }, []);
  
  // Simplified loadDeliverables function - just a stub now that grid handles loading
  const loadDeliverables = useCallback(async () => {
    // Empty stub - data loading is now handled entirely in the grid component
    // through the data providers directly
  }, []);
  
  // No need for initial load effect since the grid handles loading on mount
  
  // Get default values for a new deliverable
  const getDefaultDeliverableValues = useCallback((): Partial<Deliverable> => {
    // This follows the pattern from memory about proper OData serialization
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
  
  // Simple field editability check - now handled in the grid editor
  const isFieldEditable = useCallback(() => true, []);
  
  // These functions have been moved to useVariationDeliverableGridHandlers.ts
  // We no longer need them in the context as they're part of the grid handlers
  
  // Create memoized context value with minimal dependencies to prevent re-renders
  const contextValue = useMemo(() => ({
    state: {
      loading: state.loading,
      error: state.error,
      isReadOnly: state.isReadOnly
    },
    loadDeliverables,
    isFieldEditable,
    getDefaultDeliverableValues,
    // Utility references only
    projectGuid,
    project: variation?.project,
    variation
  }), [
    state.loading,
    state.error,
    state.isReadOnly,
    // These callbacks are stable (empty dependency arrays)
    // so they won't cause re-renders
    // Only including projectGuid and variation for actual data needs
    projectGuid,
    variation?.project,
    variation
  ]);
  
  return (
    <VariationDeliverablesContext.Provider value={contextValue}>
      {children}
    </VariationDeliverablesContext.Provider>
  );
}

/**
 * Custom hook to use the variation deliverables context
 */
export function useVariationDeliverables(): VariationDeliverablesContextProps {
  const context = useContext(VariationDeliverablesContext);
  
  if (!context) {
    throw new Error('useVariationDeliverables must be used within a VariationDeliverablesProvider');
  }
  
  return context;
}

/**
 * Custom hook to check if all required data is loaded in the variation deliverables context
 * Note: This is deprecated as data loading is now handled at the component level
 */
export function useVariationDeliverablesDataReady(): boolean {
  const { state } = useVariationDeliverables();
  return !state.loading;
}
