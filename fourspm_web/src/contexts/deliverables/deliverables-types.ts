import { Deliverable } from '@/types/odata-types';
import React from 'react';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

/**
 * Result of validating a deliverable
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

/**
 * Defines the state structure for the deliverables context
 */
export interface DeliverablesState {
  /**
   * The collection of deliverables
   */
  deliverables: Deliverable[];

  /**
   * Indicates if data is currently loading
   */
  loading: boolean;
  
  /**
   * Indicates if an operation is in progress
   */
  isProcessing: boolean;
  
  /**
   * Error message if an operation fails
   */
  error: string | null;

  /**
   * Flag to indicate if lookup data has been loaded
   */
  lookupDataLoaded: boolean;
  
  /**
   * Validation errors by field
   */
  validationErrors: Record<string, string[]>;
  
  /**
   * Error from editor operations
   */
  editorError: string | null;
}

/**
 * Defines the actions that can be dispatched to the deliverables reducer
 */
export type DeliverablesAction =
  | { type: 'FETCH_DELIVERABLES_START' }
  | { type: 'FETCH_DELIVERABLES_SUCCESS'; payload: Deliverable[] }
  | { type: 'FETCH_DELIVERABLES_ERROR'; payload: string }
  | { type: 'ADD_DELIVERABLE_START'; payload: Partial<Deliverable> }
  | { type: 'ADD_DELIVERABLE_SUCCESS'; payload: Deliverable }
  | { type: 'ADD_DELIVERABLE_ERROR'; payload: { error: string, deliverable?: Partial<Deliverable> } }
  | { type: 'UPDATE_DELIVERABLE_START'; payload: Partial<Deliverable> }
  | { type: 'UPDATE_DELIVERABLE_SUCCESS'; payload: Deliverable }
  | { type: 'UPDATE_DELIVERABLE_ERROR'; payload: { error: string, deliverable?: Partial<Deliverable> } }
  | { type: 'DELETE_DELIVERABLE_START'; payload: string }
  | { type: 'DELETE_DELIVERABLE_SUCCESS'; payload: string }
  | { type: 'DELETE_DELIVERABLE_ERROR'; payload: { error: string, id?: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECT_GUID'; payload: string }
  | { type: 'SET_LOOKUP_DATA_LOADED'; payload: boolean }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string[]> }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_EDITOR_ERROR'; payload: string | null };

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
   * Validates a deliverable against a set of validation rules
   * @param deliverable The deliverable to validate
   * @param rules Optional custom validation rules
   * @returns ValidationResult with isValid flag and errors record
   */
  validateDeliverable: (deliverable: Partial<Deliverable>, rules?: ValidationRule[]) => ValidationResult;
  
  /**
   * Initializes a new deliverable with default values
   * @param projectId The project GUID for the deliverable
   * @param project Optional project data for enhanced initialization
   * @param isVariation Whether this is a variation deliverable
   * @returns A new deliverable object with default values
   */
  initializeDeliverable: (projectId: string, project?: any, isVariation?: boolean) => Partial<Deliverable>;
  
  /**
   * Generates a document number based on deliverable details
   * @param deliverableTypeId The deliverable type ID
   * @param areaNumber The area number
   * @param discipline The discipline code
   * @param documentType The document type code
   * @param currentDeliverableGuid Optional existing deliverable GUID (for updates)
   * @param isVariation Whether this is a variation deliverable
   * @returns Promise resolving to the generated document number
   */
  generateDocumentNumber: (
    deliverableTypeId: string | number,
    areaNumber: string, 
    discipline: string, 
    documentType: string,
    currentDeliverableGuid?: string,
    isVariation?: boolean
  ) => Promise<string>;

  // CRUD operations removed as ODataGrid handles them directly via its ODataStore


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
  // setProjectGuid removed - project ID now passed explicitly to functions

  /**
   * Sets the lookup data loaded flag
   * @param loaded Whether lookup data is loaded
   */
  setLookupDataLoaded: (loaded: boolean) => void;
  
  /**
   * Invalidates all cached lookup data
   */
  invalidateAllLookups: () => void;

  /**
   * Data source for areas lookup
   */
  areasDataSource: any;

  /**
   * Data source for disciplines lookup
   */
  disciplinesDataSource: any;

  /**
   * Data source for document types lookup
   */
  documentTypesDataSource: any;

  /**
   * Flag indicating if lookup data is currently loading
   */
  isLookupDataLoading: boolean;

  /**
   * Project object with project details
   */
  project: any | null;
}

