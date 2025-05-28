import React, { createContext, useReducer, useContext, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { disciplinesReducer, initialDisciplinesState } from './disciplines-reducer';
import { DisciplinesContextProps, DisciplinesProviderProps } from './disciplines-types';
import { Discipline } from '@/types/odata-types';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

/**
 * Default validation rules for disciplines
 */
export const DISCIPLINE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'code', 
    required: true, 
    maxLength: 2,
    pattern: /^[A-Z][A-Z]$/,
    errorText: 'Code must be exactly 2 uppercase letters' 
  },
  { 
    field: 'name', 
    required: false, 
    maxLength: 500,
    errorText: 'Name cannot exceed 500 characters' 
  }
];

/**
 * Default values for new discipline
 */
export const DEFAULT_DISCIPLINE_VALUES = {
  guid: uuidv4(),
  code: '',
  name: ''
};

/**
 * Function to get fresh default values (to ensure new UUID for each new discipline)
 */
export const getDefaultDisciplineValues = () => {
  return {
    ...DEFAULT_DISCIPLINE_VALUES,
    guid: uuidv4()
  };
};

// Create the context
const DisciplinesContext = createContext<DisciplinesContextProps | undefined>(undefined);

/**
 * Provider component for the disciplines context
 * Provides state management and cache invalidation functionality
 * 
 * Note: We don't fetch disciplines data here since ODataGrid will directly
 * connect to the API endpoint. This follows the Collection View Doctrine
 * hybrid architecture pattern where the grid connects directly to endpoints.
 */
export function DisciplinesProvider({ children }: DisciplinesProviderProps): React.ReactElement {
  // Access React Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // For tracking component mounted state
  const isMountedRef = useRef(true);
  
  // Set up component lifecycle tracking
  
  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;
    
    // Clean up function to prevent state updates after unmounting
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(disciplinesReducer, initialDisciplinesState);
  
  // Action creators
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setDataLoaded = useCallback((loaded: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_DATA_LOADED', payload: loaded });
  }, []);
  
  // Token management removed - using direct access pattern with getToken()
  
  // For Collection View Doctrine patterns, the ODataGrid handles data fetching directly
  // We provide minimal implementations to satisfy the interface
  const disciplines: Discipline[] = [];
  const disciplinesLoading = state.loading;
  const disciplinesError = state.error;
  
  // This refetch function would be used if a component needs to manually trigger a refresh
  const refetchDisciplines = useCallback(async () => {
    // Invalidate disciplines cache to force ODataGrid refresh
    queryClient.invalidateQueries({ queryKey: ['disciplines'] });
    return { data: disciplines };
  }, [queryClient]);
  
  // Set data loaded to true by default since the ODataGrid manages loading state
  useEffect(() => {
    setDataLoaded(true);
  }, [setDataLoaded]);
  
  // Reset error state - errors will be handled by grid operation hooks
  useEffect(() => {
    setError(null);
  }, [setError]);
  
  // Cache invalidation function - invalidates all related lookup data
  // when disciplines data changes
  const invalidateAllLookups = useCallback(() => {
    // Invalidate any queries that might use disciplines as reference data
    queryClient.invalidateQueries({ queryKey: ['disciplines'] });
    queryClient.invalidateQueries({ queryKey: ['lookup'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
    

  }, [queryClient]);
  
  // Function to get fresh default values each time
  const getDefaultValues = useCallback(() => {
    return getDefaultDisciplineValues();
  }, []);

  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State
    state,
    setLoading,
    setError,
    setDataLoaded,
    
    // Data
    disciplines,
    disciplinesLoading,
    disciplinesError,
    refetchDisciplines,
    
    // Cache invalidation
    invalidateAllLookups,
    
    // Business logic
    validationRules: DISCIPLINE_VALIDATION_RULES,
    getDefaultValues
  }), [
    state,
    setLoading,
    setError,
    setDataLoaded,
    disciplines,
    disciplinesLoading,
    disciplinesError,
    refetchDisciplines,
    invalidateAllLookups,
    getDefaultValues
  ]);
  
  return (
    <DisciplinesContext.Provider value={contextValue}>
      {children}
    </DisciplinesContext.Provider>
  );
}

/**
 * Hook to access the disciplines context
 * Provides type safety and ensures the context is being used within its provider
 */
export function useDisciplines(): DisciplinesContextProps {
  const context = useContext(DisciplinesContext);
  
  if (!context) {
    throw new Error('useDisciplines must be used within a DisciplinesProvider');
  }
  
  return context;
}
