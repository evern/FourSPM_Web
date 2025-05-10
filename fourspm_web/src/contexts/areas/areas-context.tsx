import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { AreasContextProps, AreasProviderProps, initialAreasState } from './areas-types';
import { areasReducer } from './areas-reducer';
import { useQueryClient } from '@tanstack/react-query';

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
  // Access React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(areasReducer, initialAreasState);
  
  // Action creators
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setDataLoaded = useCallback((loaded: boolean) => {
    dispatch({ type: 'SET_DATA_LOADED', payload: loaded });
  }, []);
  
  // Set data loaded to true by default since the ODataGrid manages loading state
  useEffect(() => {
    setDataLoaded(true);
  }, [setDataLoaded]);
  
  // Reset error state - errors will be handled by grid operation hooks
  useEffect(() => {
    setError(null);
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
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State
    state,
    setLoading,
    setError,
    setDataLoaded,
    
    // Project data
    projectId,
    
    // Cache invalidation
    invalidateAllLookups
  }), [
    state,
    setLoading,
    setError,
    setDataLoaded,
    projectId,
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
