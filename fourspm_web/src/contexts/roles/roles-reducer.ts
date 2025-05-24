import { RolesState, RolesAction } from './roles-types';

/**
 * Initial state for the roles reducer
 */
export const initialRolesState: RolesState = {
  loading: false,
  error: null,
  editorError: null,
  processing: false
};

/**
 * Reducer function for managing roles state
 */
export const rolesReducer = (state: RolesState, action: RolesAction): RolesState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'SET_EDITOR_ERROR':
      return {
        ...state,
        editorError: action.payload
      };
    case 'SET_PROCESSING':
      return {
        ...state,
        processing: action.payload
      };
    default:
      return state;
  }
};
