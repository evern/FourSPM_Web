import React, { createContext, useReducer, useCallback, useMemo, useContext, useEffect, useRef } from 'react';
import { useTokenAcquisition } from '../../hooks/use-token-acquisition';
import { v4 as uuidv4 } from 'uuid';
import { ClientsState, ClientsContextProps } from './clients-types';
import { clientsReducer } from './clients-reducer';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { useAutoIncrement } from '@/hooks/utils/useAutoIncrement';
import { CLIENTS_ENDPOINT } from '@/config/api-endpoints';

const initialState: ClientsState = {
  loading: false,
  error: null,
  token: null,
};

// Default validation rules for clients
export const CLIENT_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'number', 
    required: true, 
    maxLength: 10,
    errorText: 'Client number is required and must be at most 10 characters.' 
  },
  { 
    field: 'clientContactName', 
    required: true, 
    maxLength: 100,
    errorText: 'Client contact name is required and must be at most 100 characters.' 
  }
];

// Default values for new client
export const DEFAULT_CLIENT_VALUES = {
  guid: uuidv4(),
  number: '',
  clientContactName: ''
};

// Function to get fresh default values (to ensure new UUID for each new client)
export const getDefaultClientValues = () => {
  return {
    ...DEFAULT_CLIENT_VALUES,
    guid: uuidv4()
  };
};

const ClientsContext = createContext<ClientsContextProps | undefined>(undefined);

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(clientsReducer, initialState);
  
  // Track component mount state to prevent updates after unmounting
  const isMountedRef = useRef(true);
  
  // Use the improved token acquisition hook
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

  // Add auto-increment hook to get the next client number
  const { nextNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: CLIENTS_ENDPOINT,
    field: 'number',
    padLength: 3,
    startFrom: '001'
  });

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

  // Invalidate all lookups (for cache invalidation after mutations)
  const invalidateAllLookups = useCallback(() => {
    // Implement React Query cache invalidation here if needed
  }, []);

  const getDefaultValues = useCallback(() => {
    return {
      ...getDefaultClientValues(),
      number: nextNumber
    };
  }, [nextNumber]);

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

  const contextValue = useMemo(
    () => ({ 
      state, 
      setLoading, 
      setError,
      setToken,
      acquireToken, 
      invalidateAllLookups,
      validationRules: CLIENT_VALIDATION_RULES,
      getDefaultValues,
      nextNumber,
      refreshNextNumber
    }),
    [state, setLoading, setError, setToken, acquireToken, invalidateAllLookups, getDefaultValues, nextNumber, refreshNextNumber]
  );

  return (
    <ClientsContext.Provider value={contextValue}>
      {children}
    </ClientsContext.Provider>
  );
};

export function useClients() {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
}
