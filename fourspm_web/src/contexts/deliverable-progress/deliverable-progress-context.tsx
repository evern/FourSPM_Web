import React, { createContext, useReducer, useContext, useCallback, useMemo } from 'react';
import { DeliverableProgressState, DeliverableProgressAction, DeliverableProgressContextType } from '../../contexts/deliverable-progress/deliverable-progress-types';
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

  // Use the period manager with provided initial values from props
  // This ensures the context uses the same period state that the component receives
  const periodManager = usePeriodManager(initialPeriod, startDate);
  
  // Create a callback to get the current selected period
  const getSelectedPeriod = useCallback(() => {
    return periodManager.selectedPeriod || 0;
  }, [periodManager.selectedPeriod]);

  // No longer need grid handlers in context - they will be used directly in component

  // Pass-through to the period manager for consistency
  const { selectedPeriod, progressDate, setSelectedPeriod, incrementPeriod, decrementPeriod } = periodManager;

  // Create memoized context value to prevent unnecessary re-renders
  // Focus only on state, period management, and project info
  const contextValue = useMemo(() => ({
    state,
    setSelectedPeriod,
    incrementPeriod,
    decrementPeriod,
    selectedPeriod: periodManager.selectedPeriod,
    progressDate: periodManager.progressDate,
    projectId
  }), [
    state, 
    setSelectedPeriod, 
    incrementPeriod, 
    decrementPeriod,
    periodManager.selectedPeriod,
    periodManager.progressDate,
    projectId
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
