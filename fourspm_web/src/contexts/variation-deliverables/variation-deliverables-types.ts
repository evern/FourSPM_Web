import { Deliverable } from '@/types/odata-types';
import React from 'react';

/**
 * Defines the UI status for variation deliverables that controls editing behavior
 */
export type VariationDeliverableUiStatus = 'Original' | 'Add' | 'Edit' | 'Approved' | 'Cancel' | 'View';

/**
 * State interface for the variation deliverables context
 */
export interface VariationDeliverablesState {
  deliverables: Deliverable[];
  loading: boolean;
  error: string | null;
  isReadOnly: boolean;
  lookupDataLoaded: boolean;
}

/**
 * Props for the variation deliverables context provider
 */
export interface VariationDeliverablesProviderProps {
  children: React.ReactNode;
  variationId?: string;
  projectId?: string;
}

/**
 * Parameters for adding or updating a variation deliverable
 */
export interface VariationDeliverableParams {
  deliverableGuid: string;
  variationHours: number;
  originalDeliverableGuid?: string;
  /**
   * Flag to skip updating context state when true.
   * Used for grid-level updates where the UI will handle rendering the changes.
   */
  skipStateUpdate?: boolean;
}

/**
 * Parameters for cancelling a deliverable
 */
export interface CancelDeliverableParams {
  deliverableGuid: string;
  originalDeliverableGuid?: string;
}

/**
 * Props interface for the variation deliverables context
 */
export interface VariationDeliverablesContextProps {
  state: {
    loading: boolean;
    error: string | null;
    isReadOnly: boolean;
  };
  
  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLookupDataLoaded: (loaded: boolean) => void;
  
  // Token management is handled directly through useToken()
  
  // Data operations have been moved to useVariationDeliverableGridHandlers.ts
  // They are no longer part of the context interface
  
  // CRUD operations
  fetchVariationDeliverables: () => Promise<void>;
  addExistingToVariation: (deliverable: Deliverable, skipStateUpdate?: boolean) => Promise<Deliverable>;
  addNewToVariation: (deliverable: Partial<Deliverable>) => Promise<Deliverable>;
  cancelDeliverable: (originalDeliverableGuid: string, skipStateUpdate?: boolean) => Promise<any>;
  
  // Enhanced operations with business rules
  canDeliverableBeCancelled: (deliverable: Deliverable) => { canCancel: boolean; reason?: string };
  updateVariationDeliverable: (data: any, skipStateUpdate?: boolean) => Promise<boolean>;
  addNewVariationDeliverable: (data: any, skipStateUpdate?: boolean) => Promise<boolean>;
  
  // UI helper functions
  isFieldEditable: (deliverable: Partial<Deliverable>, fieldName: string) => boolean;
  getDefaultDeliverableValues: () => Partial<Deliverable>;
  validateVariationDeliverable: (deliverable: Partial<Deliverable>) => { isValid: boolean; errors: Record<string, string[]> };
  
  // Data sources for lookup components
  areasDataSource: any;
  disciplinesDataSource: any;
  documentTypesDataSource: any;
  isLookupDataLoading: boolean;
  
  // Utility references
  projectGuid: string | undefined;
  project: any;
  variation: any;
}

/**
 * Action types for the variation deliverables reducer
 */
export type VariationDeliverablesAction =
  // Basic state management
  | { type: 'SET_DELIVERABLES'; payload: Deliverable[] }
  | { type: 'UPDATE_DELIVERABLE'; payload: Deliverable }
  | { type: 'ADD_DELIVERABLE'; payload: Deliverable }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_READ_ONLY'; payload: boolean }
  | { type: 'SET_LOOKUP_DATA_LOADED'; payload: boolean }
  
  // Fetch operations
  | { type: 'FETCH_DELIVERABLES_START' }
  | { type: 'FETCH_DELIVERABLES_SUCCESS'; payload: Deliverable[] }
  | { type: 'FETCH_DELIVERABLES_ERROR'; payload: string | null }
  
  // Add operations
  | { type: 'ADD_DELIVERABLE_START'; payload: Partial<Deliverable> }
  | { type: 'ADD_DELIVERABLE_SUCCESS'; payload: Deliverable }
  | { type: 'ADD_DELIVERABLE_ERROR'; payload: { error: string | null; deliverable: Partial<Deliverable> } }
  
  // Delete operations
  | { type: 'DELETE_DELIVERABLE_START'; payload: string }
  | { type: 'DELETE_DELIVERABLE_SUCCESS'; payload: string }
  | { type: 'DELETE_DELIVERABLE_ERROR'; payload: { error: string | null; id: string } };
