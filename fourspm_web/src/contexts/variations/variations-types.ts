import { Variation, Project } from '../../types/odata-types';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import React from 'react';

// Simplified editor event interface with only the properties we actually use
export interface EditorEvent {
  // Only keep what we actually use in handleVariationEditorPreparing
  dataField: string;
  editorOptions: {
    onValueChanged?: (args: any) => void;
    maxLength?: number;
    height?: number;
    [key: string]: any;
  };
}

// Simplified initialization event interface
export interface InitNewRowEvent {
  // Only the properties used in handleInitNewRow
  component?: {
    option: (name: string) => any;
  };
  data?: Record<string, any>;
}

// Combined state interface
export interface VariationsState {
  // Data state
  variations: Variation[];
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>;
  
  // Editor state
  isProcessing: boolean;
  editorError: string | null;
  variationFieldDependencies: Record<string, string[]>;
}

// Actions that can be dispatched
export type VariationsAction = 
  // Data operations actions
  | { type: 'FETCH_VARIATIONS_START' }
  | { type: 'FETCH_VARIATIONS_SUCCESS'; payload: Variation[] }
  | { type: 'FETCH_VARIATIONS_ERROR'; payload: string }
  | { type: 'ADD_VARIATION_START'; payload: Variation }
  | { type: 'ADD_VARIATION_SUCCESS'; payload: Variation }
  | { type: 'ADD_VARIATION_ERROR'; payload: { error: string, variation?: Variation } }
  | { type: 'UPDATE_VARIATION_START'; payload: Variation }
  | { type: 'UPDATE_VARIATION_SUCCESS'; payload: Variation }
  | { type: 'UPDATE_VARIATION_ERROR'; payload: { error: string, variation?: Variation } }
  | { type: 'DELETE_VARIATION_START'; payload: string }
  | { type: 'DELETE_VARIATION_SUCCESS'; payload: string }
  | { type: 'DELETE_VARIATION_ERROR'; payload: { error: string, id?: string } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string[]> }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  // Editor-related actions
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_EDITOR_ERROR'; payload: string | null };

// Context interface including both state and actions
export interface VariationsContextType {
  // Data state and operations
  state: VariationsState;
  
  // Validation methods
  validateVariation: (variation: Record<string, any>) => { isValid: boolean; errors: Record<string, string> };
  handleRowValidating: (e: any) => void;
  validateRowUpdating: (oldData: any, newData: any) => { isValid: boolean; errors: Record<string, string> };
  
  // Data operations
  fetchVariations: (projectId: string) => Promise<void>;
  addVariation: (variation: Variation, skipStateUpdate?: boolean) => Promise<Variation>;
  updateVariation: (variation: Variation) => Promise<Variation>;
  deleteVariation: (id: string) => Promise<void>;
  changeVariationStatus: (params: { variationId: string; approve: boolean; projectGuid: string; skipStateUpdate?: boolean }) => Promise<void>;
  
  // Project data (for anti-flickering pattern)
  project?: Project; 
  isLookupDataLoading: boolean;
  
  // Editor functions
  getDefaultVariationValues: (projectId: string) => Record<string, any>;
  handleVariationEditorPreparing: (e: EditorEvent) => void;
  handleVariationInitNewRow: (e: InitNewRowEvent) => void;
  
  // Cache invalidation
  invalidateAllLookups: () => void;
}
