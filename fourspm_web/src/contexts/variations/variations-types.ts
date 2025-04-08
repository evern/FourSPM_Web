import { Variation } from '../../types/odata-types';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import React from 'react';

// Editor event interfaces for DevExtreme components
export interface EditorEvent {
  component: any;
  element: any;
  model: any;
  editorOptions: {
    onValueChanged?: (args: any) => void;
    buttons?: Array<{
      name: string;
      location: string;
      options: {
        icon: string;
        type: string;
        hint: string;
        onClick: () => void;
      }
    }>;
    [key: string]: any;
  };
  editorName: string;
  dataField: string;
  row: {
    data: Record<string, any>;
    key: any;
    rowIndex: number;
    isNewRow?: boolean;
    values: any[];
  };
  data: Record<string, any>;
  key: any;
  rowIndex: number;
  isNewRow?: boolean;
  values: any[];
  parentType: string;
}

export interface InitNewRowEvent {
  component: any;
  element: any;
  data: Record<string, any>;
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
  validateVariation: (variation: Variation, rules?: ValidationRule[]) => boolean;
  fetchVariations: (projectId: string) => Promise<void>;
  addVariation: (variation: Variation) => Promise<Variation>;
  updateVariation: (variation: Variation) => Promise<Variation>;
  deleteVariation: (id: string) => Promise<void>;
  
  // Editor operations
  getDefaultVariationValues: (projectId?: string) => Partial<Variation>;
  handleVariationEditorPreparing: (e: EditorEvent) => void;
  handleVariationInitNewRow: (e: InitNewRowEvent) => void;
}
