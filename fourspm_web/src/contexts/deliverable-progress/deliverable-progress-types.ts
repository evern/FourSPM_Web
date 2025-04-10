// Types for the deliverable progress state and context
export interface DeliverableProgressState {
  loading: boolean;
  error: string | null;
}

// Types for the deliverable progress actions
export type DeliverableProgressAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Type for the deliverable progress context
export interface DeliverableProgressContextType {
  state: DeliverableProgressState;
  // Keep period-related functions as core state management
  setSelectedPeriod: (period: number) => void;
  incrementPeriod: () => void;
  decrementPeriod: () => void;
  selectedPeriod: number | null;
  progressDate: Date;
  // Project data (will be added if not already in context)
  projectId?: string;
}
