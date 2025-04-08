import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef } from 'react';
import { Deliverable } from '@/types/odata-types';
import { 
  DeliverablesState, 
  DeliverablesAction, 
  DeliverablesContextProps,
  DeliverablesProviderProps
} from './deliverables-types';
import { deliverablesReducer, initialDeliverablesState } from './deliverables-reducer';
import { v4 as uuidv4 } from 'uuid';

// Create the context
const DeliverablesContext = createContext<DeliverablesContextProps | undefined>(undefined);

/**
 * Provider component for the deliverables context
 * Follows the Context + Reducer pattern for clean separation of state management and UI
 */
export function DeliverablesProvider({ children }: DeliverablesProviderProps): React.ReactElement {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(deliverablesReducer, initialDeliverablesState);
  
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
  
  /**
   * Generate default values for a new deliverable
   * Memoized to prevent unnecessary re-creations
   */
  const getDeliverableDefaultValues = useCallback((projectId?: string): Partial<Deliverable> => {
    const now = new Date();
    return {
      guid: uuidv4(),
      projectGuid: projectId || state.projectGuid || '',
      isActive: true,
      isReadOnly: false,
      createdAt: now,
      modifiedAt: now
    };
  }, [state.projectGuid]);
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    setLoading,
    setError,
    setProjectGuid,
    setLookupDataLoaded,
    // Data access functions for deliverables
    getDeliverableDefaultValues
  }), [
    state, 
    setLoading,
    setError,
    setProjectGuid,
    setLookupDataLoaded,
    getDeliverableDefaultValues
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
