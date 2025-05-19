import { ProjectsState, ProjectsAction } from './projects-types';

export const initialProjectsState: ProjectsState = {
  projects: [],
  loading: false,
  error: null,
  validationErrors: {},
  token: null
};

export function projectsReducer(state: ProjectsState, action: ProjectsAction): ProjectsState {
  switch (action.type) {
    case 'SET_TOKEN':
      return { ...state, token: action.payload };

    case 'FETCH_PROJECTS_START':
      return { ...state, loading: true, error: null };
    
    case 'FETCH_PROJECTS_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        projects: action.payload,
        error: null
      };
    
    case 'FETCH_PROJECTS_ERROR':
      return { ...state, loading: false, error: action.payload };
    
    case 'ADD_PROJECT_START':
      return { ...state, loading: true, error: null };
    
    case 'ADD_PROJECT_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        projects: [...state.projects, action.payload],
        error: null
      };
    
    case 'ADD_PROJECT_ERROR':
      return { ...state, loading: false, error: action.payload.error };
    
    case 'UPDATE_PROJECT_START':
      return { ...state, loading: true, error: null };
    
    case 'UPDATE_PROJECT_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        projects: state.projects.map(p => 
          p.guid === action.payload.guid ? action.payload : p
        ),
        error: null
      };
    
    case 'UPDATE_PROJECT_ERROR':
      return { ...state, loading: false, error: action.payload.error };
    
    case 'DELETE_PROJECT_START':
      return { ...state, loading: true, error: null };
    
    case 'DELETE_PROJECT_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        projects: state.projects.filter(p => p.guid !== action.payload),
        error: null
      };
    
    case 'DELETE_PROJECT_ERROR':
      return { ...state, loading: false, error: action.payload.error };
    
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    
    case 'CLEAR_VALIDATION_ERRORS':
      return { ...state, validationErrors: {} };
      
    default:
      return state;
  }
}
