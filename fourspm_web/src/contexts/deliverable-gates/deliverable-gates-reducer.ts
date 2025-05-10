import { DeliverableGatesAction, DeliverableGatesState } from './deliverable-gates-types';

export function deliverableGatesReducer(state: DeliverableGatesState, action: DeliverableGatesAction): DeliverableGatesState {
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
    default:
      return state;
  }
}
