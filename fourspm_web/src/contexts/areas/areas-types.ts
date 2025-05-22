import { Area, Project } from '@/types/odata-types';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

/**
 * State interface for areas context
 */
export interface AreasState {
  loading: boolean;
  error: string | null;
  dataLoaded: boolean;
  token: string | null;
  nextAreaNumber: string;
}

/**
 * Initial state for areas context
 */
export const initialAreasState: AreasState = {
  loading: false,
  error: null,
  dataLoaded: false,
  token: null,
  nextAreaNumber: '01'
};

/**
 * Action types for areas reducer
 */
export type AreasAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA_LOADED'; payload: boolean }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'SET_NEXT_AREA_NUMBER'; payload: string };

// Default validation rules for areas
export const AREA_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'number', 
    required: true, 
    maxLength: 2,
    pattern: /^\d{2}$/,
    errorText: 'Area number is required and must be exactly 2 digits.' 
  },
  { 
    field: 'description', 
    required: true, 
    maxLength: 100,
    errorText: 'Description is required and must be at most 100 characters.' 
  }
];

// Default values for new area
export const DEFAULT_AREA_VALUES = {
  guid: '',
  number: '',
  description: '',
  projectGuid: ''
};

// Function to get fresh default values
export const getDefaultAreaValues = (projectId: string) => {
  return {
    ...DEFAULT_AREA_VALUES,
    projectGuid: projectId
  };
};

/**
 * Props interface for AreasContext
 */
export interface AreasContextProps {
  state: AreasState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDataLoaded: (loaded: boolean) => void;
  // Token management now handled by useToken() directly
  invalidateAllLookups: () => void;
  projectId: string;
  project?: Project;
  isLookupDataLoading: boolean;
  validationRules: ValidationRule[];
  getDefaultValues: () => any;
  nextAreaNumber: string;
  refreshNextNumber: () => void;
}

/**
 * Props interface for AreasProvider
 */
export interface AreasProviderProps {
  children: React.ReactNode;
  projectId: string;
}
