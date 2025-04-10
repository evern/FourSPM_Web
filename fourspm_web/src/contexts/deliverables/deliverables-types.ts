import { Deliverable } from '@/types/odata-types';
import React from 'react';
import { GridRowEvent, ValidationResult } from '@/hooks/grid-handlers/useDeliverableGridValidator';

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
  projectId?: string;
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
   * @param projectGuid Optional project ID to associate with the deliverable
   * @returns A partial deliverable object with default values
   */
  getDeliverableDefaultValues: (projectGuid?: string) => Partial<Deliverable>;
  
  /**
   * Determines if a field should be editable based on its name and status
   * @param fieldName Name of the field to check
   * @param uiStatus Optional UI status to consider for editability
   * @returns Boolean indicating if the field should be editable
   */
  isFieldEditable: (fieldName: string, uiStatus?: string) => boolean;
  
  /**
   * Handler for grid initialization
   */
  handleGridInitialized: (e: any) => void;
  
  /**
   * Utility to set a cell value in the grid
   */
  setCellValue: (rowIndex: number, dataField: string, value: any) => void;
  
  /**
   * Handler for validating row data
   */
  handleRowValidating: (e: GridRowEvent) => void;
  
  /**
   * Handler for updating row data
   */
  handleRowUpdating: (e: GridRowEvent) => any;
  
  /**
   * Handler for inserting new row data
   */
  handleRowInserting: (e: GridRowEvent) => void;
  
  /**
   * Handler for removing row data
   */
  handleRowRemoving: (e: GridRowEvent) => void;
  
  /**
   * Handler for initializing a new row
   */
  handleInitNewRow: (e: GridRowEvent) => void;
  
  /**
   * Validates a deliverable object
   * @param data The deliverable data to validate
   * @returns Validation result containing isValid flag and any errors
   */
  validateDeliverable: (data: Record<string, any>) => ValidationResult;
}
