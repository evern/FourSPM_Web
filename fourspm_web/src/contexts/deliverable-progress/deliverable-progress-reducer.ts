import { DeliverableProgressState, DeliverableProgressAction } from './deliverable-progress-types';

export function deliverableProgressReducer(state: DeliverableProgressState, action: DeliverableProgressAction): DeliverableProgressState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}
