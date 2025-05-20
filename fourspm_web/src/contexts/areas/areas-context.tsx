import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AreasContextProps, AreasProviderProps, initialAreasState, AREA_VALIDATION_RULES, getDefaultAreaValues } from './areas-types';
import { areasReducer } from './areas-reducer';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { baseApiService } from '../../api/base-api.service';
import { PROJECTS_ENDPOINT, AREAS_ENDPOINT } from '../../config/api-endpoints';
import { useAuth } from '../../contexts/auth';
import { useTokenAcquisition } from '../../hooks/use-token-acquisition';
import { useAutoIncrement } from '../../hooks/utils/useAutoIncrement';

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
  
  // Use the improved token acquisition hook
  const { 
    token, 
    loading: tokenLoading, 
    error: tokenError, 
    acquireToken: acquireTokenFromHook 
  } = useTokenAcquisition();
  
  // Access React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Track component mounted state to prevent updates after unmounting
  const isMountedRef = useRef(true);
  
  // Use auto-increment for area number - construct the exact URL format needed
  const endpoint = `${AREAS_ENDPOINT}?$filter=(projectGuid eq ${projectId})&$orderby=number desc&$top=1`;
  
  const { nextNumber, refreshNextNumber: refreshNextAreaNumber } = useAutoIncrement({
    endpoint, // Complete pre-built endpoint with exact OData query parameters
    field: 'number',
    padLength: 2,
    startFrom: '01'
    // No filter parameter since it's already in the endpoint
  });
  
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
  
  // Token management - using useTokenAcquisition hook
  const setToken = useCallback((tokenValue: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_TOKEN', payload: tokenValue });
  }, []);

  // Method to acquire a token - wrapper around the hook's method
  const acquireToken = useCallback(async (): Promise<string | null> => {
    return acquireTokenFromHook();
  }, [acquireTokenFromHook]);
  
  // Update token in state when it changes from the hook
  useEffect(() => {
    if (isMountedRef.current) {
      setToken(token);
    }
  }, [token, setToken]);
  
  // Handle token errors
  useEffect(() => {
    if (isMountedRef.current && tokenError) {
      setError(tokenError);
    }
  }, [tokenError, setError]);
  
  // Handle auto-refresh of lookups on cache invalidation
  useEffect(() => {
    if (isMountedRef.current && projectId && token) {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    }
  }, [queryClient, projectId, token]);

  // Wrapper for refreshNextAreaNumber to ensure component is mounted
  const refreshNextNumber = useCallback(() => {
    if (isMountedRef.current) {
      refreshNextAreaNumber();
    }
  }, [refreshNextAreaNumber]);
  
  // Set loading state based on token acquisition status
  useEffect(() => {
    if (isMountedRef.current) {
      setLoading(tokenLoading);
    }
  }, [tokenLoading, setLoading]);
  
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
    enabled: !!projectId && !!token, // Use token from the hook
    refetchOnWindowFocus: true // Auto-refresh data when window regains focus
  });
  
  // Combine loading states for lookup data - used to prevent flickering
  const isLookupDataLoading = state.loading || projectLoading;
  
  // Get default values for new areas
  const getDefaultValues = useCallback(() => {
    return {
      ...getDefaultAreaValues(projectId),
      guid: uuidv4()
    };
  }, [projectId]);

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
    invalidateAllLookups,
    
    // Validation and defaults
    validationRules: AREA_VALIDATION_RULES,
    getDefaultValues,
    nextAreaNumber: nextNumber || '01', // Use directly from the hook, not from state
    refreshNextNumber
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
    invalidateAllLookups,
    getDefaultValues,
    refreshNextNumber,
    nextNumber // Add nextNumber to dependency array to ensure updates
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
