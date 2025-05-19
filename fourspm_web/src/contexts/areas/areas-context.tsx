import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AreasContextProps, AreasProviderProps, initialAreasState } from './areas-types';
import { areasReducer } from './areas-reducer';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { baseApiService } from '../../api/base-api.service';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { useAuth } from '../../contexts/auth';
import { useMSALAuth } from '../../contexts/msal-auth';

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
const AreasContext = createContext<AreasContextProps | undefined>(undefined);

/**
 * Provider component for the areas context
 * Provides state management and cache invalidation functionality
 * 
 * Note: We don't fetch areas data here since ODataGrid will directly
 * connect to the API endpoint. This follows the Collection View Doctrine
 * hybrid architecture pattern where the grid connects directly to endpoints.
 */
export function AreasProvider({ children, projectId }: AreasProviderProps): React.ReactElement {
  // Get authentication
  const { user } = useAuth();
  const msalAuth = useMSALAuth();
  
  // Access React Query client for cache invalidation
  const queryClient = useQueryClient();
  
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
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(areasReducer, initialAreasState);
  
  // Action creators
  const setLoading = useCallback((loading: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setDataLoaded = useCallback((loaded: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_DATA_LOADED', payload: loaded });
  }, []);
  
  // Token management functions
  const setToken = useCallback((token: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_TOKEN', payload: token });
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
  
  // Set data loaded to true by default since the ODataGrid manages loading state
  useEffect(() => {
    if (isMountedRef.current) {
      setDataLoaded(true);
    }
  }, [setDataLoaded]);
  
  // Reset error state - errors will be handled by grid operation hooks
  useEffect(() => {
    if (isMountedRef.current) {
      setError(null);
    }
  }, [setError]);
  
  // Cache invalidation function - invalidates all related lookup data
  // when areas data changes
  const invalidateAllLookups = useCallback(() => {
    // Invalidate any queries that might use areas as reference data
    queryClient.invalidateQueries({ queryKey: ['areas'] });
    queryClient.invalidateQueries({ queryKey: ['lookup'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
    
    console.log('Invalidated all lookup data after areas change');
  }, [queryClient]);
  
  // Fetch project details - this is the key addition to match Deliverables context
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
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State and actions
    state,
    setLoading,
    setError,
    setDataLoaded,
    
    // Token management
    setToken,
    acquireToken,
    
    // Project data
    projectId,
    project,
    isLookupDataLoading,
    
    // Cache invalidation
    invalidateAllLookups
  }), [
    state,
    setLoading,
    setError,
    setDataLoaded,
    setToken,
    acquireToken,
    projectId,
    project,
    isLookupDataLoading,
    invalidateAllLookups
  ]);
  
  return (
    <AreasContext.Provider value={contextValue}>
      {children}
    </AreasContext.Provider>
  );
}

/**
 * Custom hook to use the areas context
 * Throws an error if used outside the AreasProvider
 */
export function useAreas(): AreasContextProps {
  const context = useContext(AreasContext);
  
  if (!context) {
    throw new Error('useAreas must be used within an AreasProvider');
  }
  
  return context;
}
