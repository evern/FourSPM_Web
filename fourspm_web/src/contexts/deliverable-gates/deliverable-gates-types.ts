// Types for Deliverable Gates context
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

export interface DeliverableGate {
  guid: string;
  name: string;
  description: string;
  maxPercentage: number;
  // Add other deliverable gate fields as needed
}

export interface DeliverableGatesState {
  loading: boolean;
  error: string | null;
}

export type DeliverableGatesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export interface DeliverableGatesContextProps {
  state: DeliverableGatesState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  invalidateAllLookups: () => void;
  validationRules: ValidationRule[];
  getDefaultValues: () => Partial<DeliverableGate>;
}
