import { Deliverable } from '@/types/odata-types';
import { VariationDeliverableUiStatus } from '@/types/app-types';
import React from 'react';

/**
 * State interface for the variation deliverables context
 */
export interface VariationDeliverablesState {
  deliverables: Deliverable[];
  loading: boolean;
  error: string | null;
  isReadOnly: boolean;
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
  
  // Grid operations
  loadDeliverables: () => Promise<void>;
  
  // Data operations have been moved to useVariationDeliverableGridHandlers.ts
  // They are no longer part of the context interface
  
  // UI helper functions
  isFieldEditable: (fieldName: string, uiStatus: VariationDeliverableUiStatus) => boolean;
  getDefaultDeliverableValues: () => Partial<Deliverable>;
  
  // Utility references - data providers moved to component level
  projectGuid: string | undefined;
  project: any;
  variation: any;
}

/**
 * Action types for the variation deliverables reducer
 */
export type VariationDeliverablesAction =
  | { type: 'SET_DELIVERABLES'; payload: Deliverable[] }
  | { type: 'UPDATE_DELIVERABLE'; payload: Deliverable }
  | { type: 'ADD_DELIVERABLE'; payload: Deliverable }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_READ_ONLY'; payload: boolean };
