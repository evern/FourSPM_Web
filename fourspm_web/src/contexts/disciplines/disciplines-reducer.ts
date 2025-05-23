import { DisciplinesState, DisciplinesAction } from './disciplines-types';

/**
 * Initial state for the disciplines context
 */
export const initialDisciplinesState: DisciplinesState = {
  loading: false,
  error: null,
  dataLoaded: false
};

/**
 * Reducer for the disciplines context
 * @param state Current state
 * @param action Action to perform
 * @returns Updated state
 */
export function disciplinesReducer(state: DisciplinesState, action: DisciplinesAction): DisciplinesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_DATA_LOADED':
      return { ...state, dataLoaded: action.payload };
    default:
      return state;
  }
}
