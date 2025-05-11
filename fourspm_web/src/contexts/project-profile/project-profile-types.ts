import { Project, Client } from '../../types/index';

// State interface
export interface ProjectProfileState {
  project: Project | null;
  originalProject: Project | null; // Store unmodified project for cancel operations
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  error: any;
  validationErrors: Record<string, string[]>;
}

// Action types
export type ProjectProfileAction =
  | { type: 'SET_PROJECT'; payload: Project }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: any }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string[]> }
  | { type: 'CLEAR_VALIDATION_ERRORS' };

// Context interface
export interface ProjectProfileContextType {
  // State
  state: ProjectProfileState;
  
  // Client data - matching the original implementation pattern
  clients: Client[];
  isClientLoading: boolean;
  
  // Form operations
  startEditing: () => void;
  cancelEditing: () => void;
  saveProject: (project: Project) => Promise<Project | null>;
  
  // Form reference
  formRef: React.RefObject<any>;
  setFormRef: (ref: any) => void;
  
  // Client operations
  handleClientSelectionChange: (e: any) => void;
  updateProjectClient: (clientId: string) => Promise<Project | null>;
  
  // Validation
  validateProject: (project: Project) => boolean;
}
