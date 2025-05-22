import { Project, Client } from '../../types/index';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import ODataStore from 'devextreme/data/odata/store';

// State interface
export interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  validationErrors: Record<string, string[]>;
  token: string | null;
}

// Actions that can be dispatched
export type ProjectsAction = 
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'FETCH_PROJECTS_START' }
  | { type: 'FETCH_PROJECTS_SUCCESS'; payload: Project[] }
  | { type: 'FETCH_PROJECTS_ERROR'; payload: string }
  | { type: 'ADD_PROJECT_START'; payload: Project }
  | { type: 'ADD_PROJECT_SUCCESS'; payload: Project }
  | { type: 'ADD_PROJECT_ERROR'; payload: { error: string, project?: Project } }
  | { type: 'UPDATE_PROJECT_START'; payload: Project }
  | { type: 'UPDATE_PROJECT_SUCCESS'; payload: Project }
  | { type: 'UPDATE_PROJECT_ERROR'; payload: { error: string, project?: Project } }
  | { type: 'DELETE_PROJECT_START'; payload: string }
  | { type: 'DELETE_PROJECT_SUCCESS'; payload: string }
  | { type: 'DELETE_PROJECT_ERROR'; payload: { error: string, id?: string } }
  | { type: 'SET_VALIDATION_ERRORS'; payload: Record<string, string[]> }
  | { type: 'CLEAR_VALIDATION_ERRORS' };

// Context interface including both state and actions
export interface ProjectsContextType {
  state: ProjectsState;
  
  // Token is available through useToken() directly
  
  // Core operations
  validateProject: (project: Project, rules?: ValidationRule[]) => boolean;
  generateProjectId: () => string;
  setProjectDefaults: (project: Partial<Project>, nextProjectNumber?: string) => Project;
  
  // Client data - ODataStore from useClientDataProvider
  clientDataSource: ODataStore;
  clientDataLoaded: boolean;
  
  // Auto-increment
  nextProjectNumber: string;
  refreshNextNumber: () => void;
}
