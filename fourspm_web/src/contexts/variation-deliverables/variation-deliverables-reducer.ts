import { Deliverable } from '@/types/odata-types';
import { VariationDeliverablesAction, VariationDeliverablesState } from './variation-deliverables-types';

/**
 * Initial state for the variation deliverables reducer
 */
export const initialVariationDeliverablesState: VariationDeliverablesState = {
  deliverables: [],
  loading: false,
  error: null,
  isReadOnly: false
};

/**
 * Reducer function for the variation deliverables context
 * Handles state transitions for deliverable management operations
 */
export const variationDeliverablesReducer = (
  state: VariationDeliverablesState,
  action: VariationDeliverablesAction
): VariationDeliverablesState => {
  switch (action.type) {
    case 'SET_DELIVERABLES':
      return { ...state, deliverables: action.payload };
      
    case 'UPDATE_DELIVERABLE': {
      const updatedDeliverables = state.deliverables.map(deliverable => 
        deliverable.guid === action.payload.guid ? action.payload : deliverable
      );
      return { ...state, deliverables: updatedDeliverables };
    }
      
    case 'ADD_DELIVERABLE':
      return { 
        ...state, 
        deliverables: [...state.deliverables, action.payload] 
      };
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_READ_ONLY':
      return { ...state, isReadOnly: action.payload };
      
    default:
      return state;
  }
};
