import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import { Deliverable } from '@/types/odata-types';
import { VariationDeliverableUiStatus } from '@/types/app-types';
import { useVariationInfo } from '@/hooks/utils/useVariationInfo';
import { useProjectInfo } from '@/hooks/utils/useProjectInfo';
import { useAreaDataProvider } from '@/hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '@/hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '@/hooks/data-providers/useDocumentTypeDataProvider';

import {
  VariationDeliverablesContextProps,
  VariationDeliverablesProviderProps
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
  // No need to track initial mount with sequential loading pattern
  
  // Get route parameters and authentication
  const params = useParams<{ variationId: string; projectId?: string }>();
  const variationId = variationGuidProp || params.variationId;
  const { user } = useAuth();
  
  // Memoize the token to prevent unnecessary re-renders
  const token = useMemo(() => user?.token, [user?.token]);
  
  /**
   * Sequential Data Loading Pattern:
   * 1. First load variation data using useVariationInfo
   * 2. Then use the projectGuid from variation to load project data
   * 3. Combine loading states to ensure we only proceed when both are loaded
   */
  // Step 1: Load variation data
  const { variation, projectGuid, loading: variationLoading, error: variationError } = 
    useVariationInfo(variationId, token);
    
  // Step 2: Load project data using projectGuid from variation
  const { project, isLoading: projectLoading, error: projectError } = 
    useProjectInfo(projectGuid, token);
    
  // Combine loading states to track overall loading progress
  const isLoading = variationLoading || projectLoading;
  const error = variationError || projectError;
    
  // Memoize the variation and project objects to ensure stable references
  const memoizedVariation = useMemo(() => variation, [variation]);
  const memoizedProject = useMemo(() => project, [project]);
  const memoizedProjectGuid = useMemo(() => projectGuid, [projectGuid]);
  
  // Memoize loading state value with combined loading status
  const loadingState = useMemo(() => ({
    loading: isLoading,
    error: error || null,
    isReadOnly: true
  }), [isLoading, error]);
  
  // Memoize minimal context value for loading state
  const loadingContextValue = useMemo(() => ({
    state: loadingState,
    // Minimal required implementations that won't be called while loading
    loadDeliverables: async () => {},
    isFieldEditable: () => false,
    getDefaultDeliverableValues: () => ({}),
    // Empty data sources for loading state
    areasDataSource: { load: () => Promise.resolve([]) },
    disciplinesDataSource: { load: () => Promise.resolve([]) },
    documentTypesDataSource: { load: () => Promise.resolve([]) },
    isLookupDataLoading: true,
    // Memoized references for stability
    projectGuid: memoizedProjectGuid,
    project: null,
    variation: null
  }), [loadingState, memoizedProjectGuid]);
  
  // If variation is still loading, render a simple provider with loading state
  if (variationLoading) {
    return (
      <VariationDeliverablesContext.Provider value={loadingContextValue}>
        {children}
      </VariationDeliverablesContext.Provider>
    );
  }
  
  // Once variation is loaded, proceed with VariationDeliverablesContent which loads everything else
  return <VariationDeliverablesContent
    variationId={variationId}
    projectGuid={memoizedProjectGuid}
    variation={memoizedVariation}
    project={memoizedProject}
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
  project,
  user
}: {
  children: React.ReactNode;
  variationId: string;
  projectGuid: string;
  variation: any;
  project: any;
  user: any;
}): React.ReactElement {
  // Initialize state with reducer - this will contain application state
  const [state, dispatch] = useReducer(variationDeliverablesReducer, initialVariationDeliverablesState);
  
  // Implement staggered loading pattern for dependent data
  // Only load data providers when we have valid variation and project data
  const shouldLoadProviders = !!variation && !!project && !!projectGuid;
  
  // Call all hooks at the top level with React (required by Rules of Hooks)
  // But use the shouldLoadProviders flag to control when they actually fetch data
  const { areasDataSource, isLoading: areasLoading } = useAreaDataProvider(
    shouldLoadProviders ? projectGuid : undefined
  );

  const { disciplinesDataSource, isLoading: disciplinesLoading } = useDisciplineDataProvider(
    shouldLoadProviders ? true : undefined
  );

  const { documentTypesDataSource, isLoading: documentTypesLoading } = useDocumentTypeDataProvider(
    shouldLoadProviders ? true : undefined
  );

  // Combine lookup data loading states for a single loading indicator
  const isLookupDataLoading = useMemo(
    () => areasLoading || disciplinesLoading || documentTypesLoading,
    [areasLoading, disciplinesLoading, documentTypesLoading]
  );

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
  
  // Create stable state object
  const stableState = useMemo(() => ({
    loading: state.loading,
    error: state.error,
    isReadOnly: state.isReadOnly
  }), [state.loading, state.error, state.isReadOnly]);
  
  // Create the context value with all required data providers
  const contextValue = useMemo(() => ({
    state: stableState,
    isFieldEditable,
    getDefaultDeliverableValues,
    // Data sources for lookups
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    // Reference data
    projectGuid,
    project,
    variation
  }), [
    stableState,
    isFieldEditable,
    getDefaultDeliverableValues,
    // Data sources dependencies
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    // Reference data dependencies
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
 * Custom hook to use the variation deliverables context
 */
export function useVariationDeliverables(): VariationDeliverablesContextProps {
  const context = useContext(VariationDeliverablesContext);
  
  if (!context) {
    throw new Error('useVariationDeliverables must be used within a VariationDeliverablesProvider');
  }
  
  return context;
}


