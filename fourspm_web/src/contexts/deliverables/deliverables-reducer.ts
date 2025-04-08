import { DeliverablesState, DeliverablesAction } from './deliverables-types';

/**
 * Initial state for the deliverables context
 */
export const initialDeliverablesState: DeliverablesState = {
  loading: false,
  error: null,
  projectGuid: null,
  lookupDataLoaded: false,
};

/**
 * Reducer function to handle state updates for deliverables
 * @param state Current state
 * @param action Action to perform
 * @returns Updated state
 */
export function deliverablesReducer(state: DeliverablesState, action: DeliverablesAction): DeliverablesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROJECT_GUID':
      return { ...state, projectGuid: action.payload };
    case 'SET_LOOKUP_DATA_LOADED':
      return { ...state, lookupDataLoaded: action.payload };
    default:
      return state;
  }
}
