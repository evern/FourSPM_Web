import React, { createContext, useReducer, useCallback, useMemo, useContext, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DeliverableGatesState, DeliverableGatesContextProps } from './deliverable-gates-types';
import { deliverableGatesReducer } from './deliverable-gates-reducer';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { useTokenAcquisition } from '@/hooks/use-token-acquisition';

const initialState: DeliverableGatesState = {
  loading: false,
  error: null,
  token: null,
};

// Default validation rules for deliverable gates
export const DELIVERABLE_GATE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'name', 
    required: true, 
    maxLength: 50,
    errorText: 'Gate name is required and must be at most 50 characters.' 
  },
  { 
    field: 'description', 
    required: false, 
    maxLength: 255,
    errorText: 'Description must not exceed 255 characters.' 
  },
  {
    field: 'maxPercentage',
    required: true,
    min: 0,
    max: 100,
    errorText: 'Maximum percentage must be between 0 and 100.'
  }
];

// Default values for new deliverable gate
export const DEFAULT_DELIVERABLE_GATE_VALUES = {
  guid: uuidv4(),
  name: '',
  maxPercentage: 0
};

// Function to get fresh default values (to ensure new UUID for each new gate)
export const getDefaultDeliverableGateValues = () => {
  return {
    ...DEFAULT_DELIVERABLE_GATE_VALUES,
    guid: uuidv4()
  };
};

const DeliverableGatesContext = createContext<DeliverableGatesContextProps | undefined>(undefined);

export const DeliverableGatesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(deliverableGatesReducer, initialState);
  
  // Track component mount state to prevent updates after unmounting
  const isMountedRef = useRef(true);
  
  // Use the centralized token acquisition hook
  const { 
    token, 
    loading: tokenLoading, 
    error: tokenError, 
    acquireToken: acquireTokenFromHook 
  } = useTokenAcquisition();
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  const setToken = useCallback((token: string | null) => {
    if (isMountedRef.current) {
      dispatch({ type: 'SET_TOKEN', payload: token });
    }
  }, []);
  
  // Method to acquire a token - now just a pass-through to the hook
  const acquireToken = useCallback(async (): Promise<string | null> => {
    return acquireTokenFromHook();
  }, [acquireTokenFromHook]);
  
  // Sync token state from the hook to the context
  useEffect(() => {
    if (isMountedRef.current && token !== undefined) {
      setToken(token);
    }
  }, [token, setToken]);
  
  // Sync loading state from the hook to the context
  useEffect(() => {
    if (isMountedRef.current) {
      dispatch({ type: 'SET_LOADING', payload: tokenLoading });
    }
  }, [tokenLoading]);
  
  // Sync error state from the hook to the context
  useEffect(() => {
    if (isMountedRef.current && tokenError) {
      dispatch({ type: 'SET_ERROR', payload: tokenError });
    }
  }, [tokenError]);

  // Invalidate all lookups (for cache invalidation after mutations)
  const invalidateAllLookups = useCallback(() => {
    // This will be handled by React Query's cache invalidation
    // The actual implementation would use queryClient.invalidateQueries
    console.log('Invalidating deliverable gates cache');
  }, []);

  const getDefaultValues = useCallback(() => {
    return getDefaultDeliverableGateValues();
  }, []);

  // Token acquisition is now handled by the useTokenAcquisition hook
  // No need for manual token acquisition in useEffect

  const contextValue = useMemo(
    () => ({ 
      state, 
      setLoading, 
      setError,
      setToken,
      acquireToken, 
      invalidateAllLookups,
      validationRules: DELIVERABLE_GATE_VALIDATION_RULES,
      getDefaultValues
    }),
    [state, setLoading, setError, setToken, acquireToken, invalidateAllLookups, getDefaultValues]
  );

  return (
    <DeliverableGatesContext.Provider value={contextValue}>
      {children}
    </DeliverableGatesContext.Provider>
  );
};

export function useDeliverableGates() {
  const context = useContext(DeliverableGatesContext);
  if (!context) {
    throw new Error('useDeliverableGates must be used within a DeliverableGatesProvider');
  }
  return context;
}
