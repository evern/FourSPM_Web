import React, { createContext, useReducer, useContext, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { disciplinesReducer, initialDisciplinesState } from './disciplines-reducer';
import { DisciplinesContextProps, DisciplinesProviderProps } from './disciplines-types';
import { Discipline } from '@/types/odata-types';
import { DISCIPLINES_ENDPOINT } from '@/config/api-endpoints';
import { baseApiService } from '@/api/base-api.service';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { useToken } from '@/contexts/token-context';

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
  
  // For token management
  const isMountedRef = useRef(true);
  
  // Direct token access from localStorage instead of useToken hook
  const [token, setTokenState] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  
  // Initialize token from localStorage
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    try {
      // Get token directly from localStorage
      const storedToken = localStorage.getItem('fourspm_auth_token');
      if (storedToken) {
        setTokenState(storedToken);
        console.log('DisciplinesContext: Retrieved token from localStorage');
      } else {
        console.log('DisciplinesContext: No token found in localStorage');
        setTokenError('No authentication token available');
      }
    } catch (error) {
      console.error('Error retrieving token from localStorage:', error);
      setTokenError('Failed to retrieve authentication token');
    }
  }, []);
  
  // Get the current token for API calls
  const userToken = token;
  
  // This will be used in place of the acquireToken function below
  
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
  
  // Token management functions - kept for backward compatibility
  const setToken = useCallback((token: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_TOKEN', payload: token });
  }, []);
  
  // Update state when token changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    // Update token in state used by components that consume this context
    dispatch({ type: 'SET_TOKEN', payload: token });
    
    // Update loading and error states
    dispatch({ type: 'SET_LOADING', payload: tokenLoading });
    
    if (tokenError) {
      dispatch({ type: 'SET_ERROR', payload: tokenError });
    }
    
    console.log('DisciplinesContext: State updated with token:', token);
  }, [token, tokenLoading, tokenError]);
  
  // Token acquisition function for ODataGrid's onTokenExpired callback
  const acquireToken = useCallback(async (): Promise<string | null> => {
    if (!isMountedRef.current) return null;
    
    setTokenLoading(true);
    try {
      // Try to get a fresh token from localStorage first
      const storedToken = localStorage.getItem('fourspm_auth_token');
      if (storedToken) {
        setTokenState(storedToken);
        console.log('DisciplinesContext: Refreshed token from localStorage');
        return storedToken;
      }
      
      // If we couldn't get a token from localStorage, return the current userToken
      // or null if that's not available either
      if (!userToken) {
        setTokenError('Could not acquire a valid authentication token');
      }
      return userToken || null;
    } catch (error) {
      console.error('Error acquiring token:', error);
      setTokenError('Failed to acquire authentication token');
      return null;
    } finally {
      if (isMountedRef.current) {
        setTokenLoading(false);
      }
    }
  }, [userToken]);
  
  // For Collection View Doctrine patterns, the ODataGrid handles data fetching directly
  // We provide minimal implementations to satisfy the interface
  const disciplines: Discipline[] = [];
  const disciplinesLoading = tokenLoading || false;
  const disciplinesError = tokenError || null;
  
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
    
    console.log('Invalidated all lookup data after disciplines change');
  }, [queryClient]);
  
  // Function to get fresh default values each time
  const getDefaultValues = useCallback(() => {
    return getDefaultDisciplineValues();
  }, []);

  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    // State - expose token directly in state to make it accessible
    state,
    setLoading,
    setError,
    setDataLoaded,
    
    // Token management
    acquireToken,
    
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
    acquireToken,
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
