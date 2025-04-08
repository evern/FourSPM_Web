import React, { createContext, useReducer, useContext, useCallback, useMemo } from 'react';
import { useAuth } from '../auth';
import { DeliverableProgressState, DeliverableProgressAction, DeliverableProgressContextType } from '../../contexts/deliverable-progress/deliverable-progress-types';
import { useDeliverableProgressGridHandlers } from '../../hooks/grid-handlers/useDeliverableProgressGridHandlers';
import { usePeriodManager } from '../../hooks/utils/usePeriodManager';

// Create a context with a default undefined value
const DeliverableProgressContext = createContext<DeliverableProgressContextType | undefined>(undefined);

// Reducer function to handle state updates
function deliverableProgressReducer(state: DeliverableProgressState, action: DeliverableProgressAction): DeliverableProgressState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Context provider component
export interface DeliverableProgressProviderProps {
  children: React.ReactNode;
  projectId: string;
  initialPeriod?: number;
  startDate?: string;
}

export function DeliverableProgressProvider({ 
  children, 
  projectId, 
  initialPeriod = 0, 
  startDate = undefined 
}: DeliverableProgressProviderProps): React.ReactElement {
  // Get the initial period and project start date from stored settings or other source
  // In a real implementation, this would come from the project data
  // Initialize state with reducer - without period management which is now handled by usePeriodManager
  const [state, dispatch] = useReducer(deliverableProgressReducer, {
    loading: false,
    error: null
  });

  const { user } = useAuth();

  // Use the period manager with provided initial values from props
  // This ensures the context uses the same period state that the component receives
  const periodManager = usePeriodManager(initialPeriod, startDate);
  
  // Create a callback to get the current selected period
  const getSelectedPeriod = useCallback(() => {
    return periodManager.selectedPeriod || 0;
  }, [periodManager.selectedPeriod]);

  // Use grid handlers hook to get all grid event handlers
  const gridHandlers = useDeliverableProgressGridHandlers({
    projectGuid: projectId,
    userToken: user?.token,
    getSelectedPeriod,
    progressDate: periodManager.progressDate
  });

  // Pass-through function for grid handlers without state changes
  // This prevents the context-level state updates that would trigger grid reloads
  const handleRowUpdating = useCallback(async (e: any) => {
    if (!user?.token) {
      e.cancel = true;
      return;
    }

    try {
      // Direct pass-through to the handler without changing context state
      // This prevents React re-renders that would cause grid refreshes
      await gridHandlers.handleRowUpdating(e);
    } catch (error) {
      console.error('Error updating progress:', error);
      e.cancel = true;
    }
  }, [gridHandlers.handleRowUpdating, user?.token]);

  // Pass-through to the period manager for consistency
  const { selectedPeriod, progressDate, setSelectedPeriod, incrementPeriod, decrementPeriod } = periodManager;

  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    handleRowUpdating,
    handleRowValidating: gridHandlers.handleRowValidating,
    handleEditorPreparing: gridHandlers.handleEditorPreparing,
    handleGridInitialized: gridHandlers.handleGridInitialized,
    setSelectedPeriod,
    incrementPeriod,
    decrementPeriod,
    selectedPeriod: periodManager.selectedPeriod,
    progressDate: periodManager.progressDate
  }), [
    state, 
    handleRowUpdating, 
    gridHandlers.handleRowValidating, 
    gridHandlers.handleEditorPreparing, 
    gridHandlers.handleGridInitialized,
    setSelectedPeriod, 
    incrementPeriod, 
    decrementPeriod,
    periodManager.selectedPeriod,
    periodManager.progressDate
  ]);

  return (
    <DeliverableProgressContext.Provider value={contextValue}>
      {children}
    </DeliverableProgressContext.Provider>
  );
}

// Custom hook to use the context
export function useDeliverableProgress(): DeliverableProgressContextType {
  const context = useContext(DeliverableProgressContext);
  if (context === undefined) {
    throw new Error('useDeliverableProgress must be used within a DeliverableProgressProvider');
  }
  return context;
}
