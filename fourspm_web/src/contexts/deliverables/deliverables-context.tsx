import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { 
  DeliverablesContextProps,
  DeliverablesProviderProps
} from './deliverables-types';
import { deliverablesReducer, initialDeliverablesState } from './deliverables-reducer';
import { useAuth } from '@/contexts/auth';
import { useParams } from 'react-router-dom';
// Removed direct import of useDeliverableGridValidator since it's used inside useDeliverableGridHandlers
import { useDeliverableGridHandlers } from '@/hooks/grid-handlers/useDeliverableGridHandlers';
// Removed useGridUtils import since it's used inside useDeliverableGridHandlers
import { useProjectInfo } from '@/hooks/utils/useProjectInfo';
import { useAreaDataProvider } from '@/hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '@/hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '@/hooks/data-providers/useDocumentTypeDataProvider';



// Create the context
const DeliverablesContext = createContext<DeliverablesContextProps | undefined>(undefined);

/**
 * Provider component for the deliverables context
 * Follows the Context + Reducer pattern for clean separation of state management and UI
 * Implements a sequential loading pattern for better performance
 */
export function DeliverablesProvider({ children, projectId: projectIdProp }: DeliverablesProviderProps): React.ReactElement {
  /**
   * Sequential Data Loading Pattern:
   * 1. First load project data using useProjectInfo
   * 2. Then load dependent data in the content component
   * 3. Combine loading states to ensure we only proceed when project data is loaded
   */
  
  // Get route parameters and authentication
  const params = useParams<{ projectId: string }>();
  const projectId = projectIdProp || params.projectId;
  const { user } = useAuth();
  
  // Step 1: Load project data
  const { project, isLoading: projectLoading, error: projectError } = 
    useProjectInfo(projectId, user?.token);
  
  // Memoize the project object to ensure stable references
  const memoizedProject = useMemo(() => project, [project]);
  
  // Create minimal loading state
  const loadingState = useMemo(() => ({
    loading: projectLoading,
    error: projectError ? projectError.message : null,
    projectGuid: projectId || null,
    lookupDataLoaded: false
  }), [projectLoading, projectError, projectId]);
  
  // Create a loading context value with minimal implementations
  const loadingContextValue = useMemo(() => ({
    state: loadingState,
    // Minimal implementations for required methods
    setLoading: () => {},
    setError: () => {},
    setProjectGuid: () => {},
    setLookupDataLoaded: () => {},
    // Empty data sources
    areasDataSource: { load: () => Promise.resolve([]) },
    disciplinesDataSource: { load: () => Promise.resolve([]) },
    documentTypesDataSource: { load: () => Promise.resolve([]) },
    isLookupDataLoading: true,
    project: null
  }), [loadingState]);
  
  // If still loading project, render minimal provider
  if (projectLoading) {
    return <DeliverablesContext.Provider value={loadingContextValue}>
      {children}
    </DeliverablesContext.Provider>;
  }
  
  // Render full content once project is loaded
  return <DeliverablesContent 
    projectId={projectId} 
    project={memoizedProject}
    user={user}
  >
    {children}
  </DeliverablesContent>;
}

/**
 * Internal component that loads lookup data and provides the full context implementation
 * Only rendered after project data is successfully loaded
 */
function DeliverablesContent({
  children,
  projectId,
  project,
  user
}: {
  children: React.ReactNode;
  projectId: string;
  project: any;
  user: any;
}): React.ReactElement {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(deliverablesReducer, {
    ...initialDeliverablesState,
    projectGuid: projectId
  });
  
  // We don't need to call useGridUtils directly - these are provided by the grid handlers
  
  // Load data providers only when project is available
  const shouldLoadProviders = !!project && !!projectId;
  
  // Data providers with conditional loading
  const { areasDataSource, isLoading: areasLoading } = useAreaDataProvider(
    shouldLoadProviders ? projectId : undefined
  );
  
  const { disciplinesDataSource, isLoading: disciplinesLoading } = useDisciplineDataProvider(
    shouldLoadProviders ? true : undefined
  );
  
  const { documentTypesDataSource, isLoading: documentTypesLoading } = useDocumentTypeDataProvider(
    shouldLoadProviders ? true : undefined
  );
  
  // Combine loading states for lookup data
  const isLookupDataLoading = useMemo(() => 
    areasLoading || disciplinesLoading || documentTypesLoading,
    [areasLoading, disciplinesLoading, documentTypesLoading]
  );
  
  // Get all grid handler functions from a single source
  const { 
    handleRowValidating,
    handleRowUpdating, 
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow: gridHandlerInitNewRow,
    handleEditorPreparing,
    validateDeliverable,
    setCellValue,
    handleGridInitialized
  } = useDeliverableGridHandlers({
    projectGuid: projectId,
    userToken: user?.token,
    project // Pass project to the grid handler
  });

  // Action creators
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  const setProjectGuid = useCallback((projectGuid: string) => {
    dispatch({ type: 'SET_PROJECT_GUID', payload: projectGuid });
  }, []);
  
  const setLookupDataLoaded = useCallback((loaded: boolean) => {
    dispatch({ type: 'SET_LOOKUP_DATA_LOADED', payload: loaded });
  }, []);


  // Note: Default value generation and row initialization are handled by
  // useDeliverableGridHandlers.ts which uses useDeliverableGridEditor.ts internally
  
  // Update lookup data loaded flag when all data sources are loaded
  useEffect(() => {
    setLookupDataLoaded(!isLookupDataLoading);
  }, [isLookupDataLoading, setLookupDataLoaded]);
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    setLoading,
    setError,
    setProjectGuid,
    setLookupDataLoaded,
    // Data providers
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    // Project data
    project
  }), [
    state, 
    setLoading,
    setError,
    setProjectGuid,
    setLookupDataLoaded,
    // Data provider dependencies
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    // Project data dependency
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
