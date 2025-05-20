// Types for Clients context
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';

export interface Client {
  guid: string;
  number: string;
  name: string;
  // Add other client fields as needed
}

export interface ClientsState {
  loading: boolean;
  error: string | null;
  token: string | null;
}

export interface ClientsContextProps {
  state: ClientsState;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setToken: (token: string | null) => void;
  acquireToken: () => Promise<string | null>;
  invalidateAllLookups: () => void;
  validationRules: ValidationRule[];
  getDefaultValues: () => Partial<Client>;
  nextNumber: string;
  refreshNextNumber: () => void;
}
