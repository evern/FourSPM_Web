// Types for document types context
import { Reducer } from 'react';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { Project } from '../../types/odata-types';

export interface DocumentType {
  guid: string;
  code: string;
  description: string;
}

export interface DocumentTypesState {
  loading: boolean;
  error: string | null;
  token: string | null;
}

export type DocumentTypesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TOKEN'; payload: string | null };

export interface DocumentTypesContextType {
  state: DocumentTypesState;
  // Token management now handled by useToken() directly
  invalidateAllLookups: () => void;
  documentTypesLoading: boolean;
  documentTypesError: unknown;
  validationRules: ValidationRule[];
  getDefaultValues: () => any;
  // Project data for title display
  project?: Project;
  projectId?: string;
  isLookupDataLoading: boolean;
}

export type DocumentTypesReducer = Reducer<DocumentTypesState, DocumentTypesAction>;
