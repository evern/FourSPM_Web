import { Project } from '../../types/odata-types';

// Types for the deliverable progress state and context
export interface DeliverableProgressState {
  loading: boolean;
  error: string | null;
  token: string | null;
}

/**
 * Interface for validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorField?: string;
}

// Types for the deliverable progress actions
export type DeliverableProgressAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOKEN'; payload: string | null };

// Type for the deliverable progress context
export interface DeliverableProgressContextType {
  // State management
  state: DeliverableProgressState;
  
  // Token management now handled by useToken() directly
  
  // Period management
  setSelectedPeriod: (period: number) => void;
  incrementPeriod: () => void;
  decrementPeriod: () => void;
  selectedPeriod: number | null;
  progressDate: Date;
  
  // Project data
  projectId?: string;
  project?: Project;
  isLookupDataLoading: boolean;
  
  // Deliverable gates data
  deliverableGates: any[];
  isGatesLoading: boolean;
  gatesError: any;
  
  // Validation functions
  validateProgress: (progress: Record<string, any>) => ValidationResult;
  validateGatePercentage: (event: any) => boolean;
  
  // Business logic functions
  processProgressUpdate: (key: string, newData: any, oldData: any) => Promise<void>;
}
