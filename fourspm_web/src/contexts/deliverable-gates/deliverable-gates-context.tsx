import React, { createContext, useReducer, useCallback, useMemo, useContext, useEffect } from 'react';
import { useMSALAuth } from '../../contexts/msal-auth';
import { v4 as uuidv4 } from 'uuid';
import { DeliverableGatesState, DeliverableGatesContextProps } from './deliverable-gates-types';
import { deliverableGatesReducer } from './deliverable-gates-reducer';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

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
  description: '',
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
  const msalAuth = useMSALAuth();

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  const setToken = useCallback((token: string | null) => {
    dispatch({ type: 'SET_TOKEN', payload: token });
  }, []);
  
  // Method to acquire a fresh token and update state
  const acquireToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await msalAuth.acquireToken();
      if (token) {
        setToken(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error acquiring token:', error);
      return null;
    }
  }, [msalAuth.acquireToken, setToken]);

  // Invalidate all lookups (for cache invalidation after mutations)
  const invalidateAllLookups = useCallback(() => {
    // Implement React Query cache invalidation here if needed
    console.log('Invalidating deliverable gates cache');
  }, []);

  const getDefaultValues = useCallback(() => {
    return getDefaultDeliverableGateValues();
  }, []);

  // Acquire token when context is initialized
  useEffect(() => {
    const getInitialToken = async () => {
      await acquireToken();
    };
    
    getInitialToken();
  }, [acquireToken]);

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
