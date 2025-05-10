import { Discipline } from '@/types/odata-types';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

/**
 * State interface for the disciplines context
 */
export interface DisciplinesState {
  loading: boolean;
  error: string | null;
  dataLoaded: boolean;
}

/**
 * Action types for the disciplines reducer
 */
export type DisciplinesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA_LOADED'; payload: boolean };

/**
 * Props for the disciplines context provider
 */
export interface DisciplinesProviderProps {
  children: React.ReactNode;
}

/**
 * Context interface for the disciplines context
 */
export interface DisciplinesContextProps {
  // State
  state: DisciplinesState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDataLoaded: (loaded: boolean) => void;
  
  // Data
  disciplines: Discipline[];
  disciplinesLoading: boolean;
  disciplinesError: unknown;
  refetchDisciplines: () => Promise<any>;
  
  // Cache invalidation
  invalidateAllLookups: () => void;
  
  // Business logic
  validationRules: ValidationRule[];
  getDefaultValues: () => Partial<Discipline>;
}
