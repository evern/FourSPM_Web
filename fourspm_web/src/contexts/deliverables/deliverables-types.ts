import { Deliverable } from '@/types/odata-types';
import React from 'react';

/**
 * Defines the state structure for the deliverables context
 */
export interface DeliverablesState {
  /**
   * Indicates if data is currently loading
   */
  loading: boolean;
  
  /**
   * Error message if an operation fails
   */
  error: string | null;

  /**
   * Current project GUID for scoping deliverables
   */
  projectGuid: string | null;

  /**
   * Flag to indicate if lookup data has been loaded
   */
  lookupDataLoaded: boolean;
}

/**
 * Defines the actions that can be dispatched to the deliverables reducer
 */
export type DeliverablesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECT_GUID'; payload: string }
  | { type: 'SET_LOOKUP_DATA_LOADED'; payload: boolean };

/**
 * Props interface for the DeliverablesProvider component
 */
export interface DeliverablesProviderProps {
  children: React.ReactNode;
}

/**
 * Defines the context API for deliverables
 */
export interface DeliverablesContextProps {
  /**
   * Current state of the deliverables context
   */
  state: DeliverablesState;
  
  /**
   * REMOVED: Validation is now handled by useDeliverableGridValidator
   * See hooks/grid-handlers/useDeliverableGridValidator.ts
   */

  /**
   * Sets the loading state
   * @param loading New loading state
   */
  setLoading: (loading: boolean) => void;
  
  /**
   * Sets an error message
   * @param error Error message or null to clear
   */
  setError: (error: string | null) => void;
  
  /**
   * Sets the current project GUID
   * @param projectGuid The project GUID
   */
  setProjectGuid: (projectGuid: string) => void;

  /**
   * Sets the lookup data loaded flag
   * @param loaded Whether lookup data is loaded
   */
  setLookupDataLoaded: (loaded: boolean) => void;
  
  /**
   * Provides default values for a new deliverable
   * @param projectId Optional project ID to associate with the deliverable
   * @returns A partial deliverable object with default values
   */
  getDeliverableDefaultValues: (projectId?: string) => Partial<Deliverable>;
}
