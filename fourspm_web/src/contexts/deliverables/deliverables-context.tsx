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
import { useAuth } from '@/contexts/auth';
import { useDeliverableGridValidator } from '@/hooks/grid-handlers/useDeliverableGridValidator';
import { useGridUtils } from '@/hooks/utils/useGridUtils';
import { GridRowEvent } from '@/hooks/grid-handlers/useDeliverableGridValidator';

/**
 * These fields are calculated by the backend and should always be read-only
 * Used by deliverable-related handlers to determine field editability
 */
export const ALWAYS_READONLY_DELIVERABLE_FIELDS = [
  'bookingCode',
  'clientNumber',
  'projectNumber',
  'totalHours'
];

// Create the context
const DeliverablesContext = createContext<DeliverablesContextProps | undefined>(undefined);

/**
 * Provider component for the deliverables context
 * Follows the Context + Reducer pattern for clean separation of state management and UI
 */
export function DeliverablesProvider({ children, projectId }: DeliverablesProviderProps): React.ReactElement {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(deliverablesReducer, initialDeliverablesState);
  const { user } = useAuth();
  
  // Get grid utility methods
  const { setCellValue, handleGridInitialized } = useGridUtils();
  
  // Get the validator functions from useDeliverableGridValidator
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    validateDeliverable
  } = useDeliverableGridValidator({
    projectGuid: projectId || state.projectGuid || '',
    userToken: user?.token
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

  /**
   * Defines which fields are editable based on the deliverable status
   */
  const isFieldEditable = useCallback((fieldName: string, uiStatus?: string) => {
    // Use the shared readonly fields list
    if (ALWAYS_READONLY_DELIVERABLE_FIELDS.includes(fieldName)) {
      return false;
    }
    return true; // All other fields are editable by default
  }, []);
  
  /**
   * Handle deliverable row removal - simple pass-through implementation
   */
  const handleRowRemoving = useCallback((e: GridRowEvent) => {
    // No special handling for removal at this level
    // Any confirmation dialog would be handled at the UI level
  }, []);
  
  /**
   * Generate default values for a new deliverable
   * Memoized to prevent unnecessary re-creations
   */
  const getDeliverableDefaultValues = useCallback((projectGuid?: string): Partial<Deliverable> => {
    const now = new Date();
    const deliverableGuid = uuidv4();
    return {
      guid: deliverableGuid,
      originalDeliverableGuid: deliverableGuid, // For variation tracking
      projectGuid: projectGuid || state.projectGuid || '',
      departmentId: 'Design',
      deliverableTypeId: 'Deliverable',
      documentType: '',
      clientDocumentNumber: '',
      discipline: '',
      areaNumber: '',
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,
      totalCost: 0,
      isActive: true,
      isReadOnly: false,
      createdAt: now,
      modifiedAt: now
    };
  }, [state.projectGuid]);

  /**
   * Handle initialization of a new deliverable row
   */
  const handleInitNewRow = useCallback((e: GridRowEvent) => {
    if (e?.data) {
      // Apply default deliverable values
      const projectGuidToUse = projectId || (state.projectGuid || '');
      const defaults = getDeliverableDefaultValues(projectGuidToUse);
      Object.assign(e.data, defaults);
    }
  }, [getDeliverableDefaultValues, projectId, state.projectGuid]);
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    setLoading,
    setError,
    setProjectGuid,
    setLookupDataLoaded,
    // Data access functions for deliverables
    getDeliverableDefaultValues,
    // Grid handlers
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    validateDeliverable,
    handleInitNewRow,
    // Grid utilities
    handleGridInitialized,
    setCellValue,
    isFieldEditable
  }), [
    state, 
    setLoading,
    setError,
    setProjectGuid,
    setLookupDataLoaded,
    getDeliverableDefaultValues,
    // Grid handler dependencies
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    validateDeliverable,
    handleInitNewRow,
    // Grid utilities dependencies
    handleGridInitialized,
    setCellValue,
    isFieldEditable
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
