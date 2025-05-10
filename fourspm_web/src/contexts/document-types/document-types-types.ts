// Types for document types context
import { Reducer } from 'react';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

export interface DocumentType {
  guid: string;
  code: string;
  description: string;
}

export interface DocumentTypesState {
  loading: boolean;
  error: string | null;
}

export type DocumentTypesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export interface DocumentTypesContextType {
  state: DocumentTypesState;
  invalidateAllLookups: () => void;
  documentTypesLoading: boolean;
  documentTypesError: unknown;
  validationRules: ValidationRule[];
  getDefaultValues: () => any;
}

export type DocumentTypesReducer = Reducer<DocumentTypesState, DocumentTypesAction>;
