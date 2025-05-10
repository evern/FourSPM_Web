import { Area } from '@/types/odata-types';
import { RefetchOptions } from '@tanstack/react-query';

/**
 * State interface for areas context
 */
export interface AreasState {
  loading: boolean;
  error: string | null;
  dataLoaded: boolean;
}

/**
 * Initial state for areas context
 */
export const initialAreasState: AreasState = {
  loading: false,
  error: null,
  dataLoaded: false
};

/**
 * Action types for areas reducer
 */
export type AreasAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA_LOADED'; payload: boolean };

/**
 * Props interface for AreasContext
 */
export interface AreasContextProps {
  state: AreasState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDataLoaded: (loaded: boolean) => void;
  invalidateAllLookups: () => void;
  projectId: string;
}

/**
 * Props interface for AreasProvider
 */
export interface AreasProviderProps {
  children: React.ReactNode;
  projectId: string;
}
