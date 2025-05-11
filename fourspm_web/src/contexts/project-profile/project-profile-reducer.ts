import { ProjectProfileState, ProjectProfileAction } from './project-profile-types';

export const initialProjectProfileState: ProjectProfileState = {
  project: null,
  originalProject: null,
  isLoading: false,
  isSaving: false,
  isEditing: false,
  error: null,
  validationErrors: {}
};

export function projectProfileReducer(
  state: ProjectProfileState,
  action: ProjectProfileAction
): ProjectProfileState {
  switch (action.type) {
    case 'SET_PROJECT':
      // When setting the project, also store a copy as the original project
      return { ...state, project: action.payload, originalProject: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_EDITING':
      // When starting edit mode, keep original project as is
      // When ending edit mode, we'll use the cancelEditing function to restore from originalProject
      return { ...state, isEditing: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'CLEAR_VALIDATION_ERRORS':
      return { ...state, validationErrors: {} };
    default:
      return state;
  }
}
