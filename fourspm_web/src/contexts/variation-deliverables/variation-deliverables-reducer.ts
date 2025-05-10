// Variation deliverables reducer
import { VariationDeliverablesAction, VariationDeliverablesState } from './variation-deliverables-types';

/**
 * Initial state for the variation deliverables reducer
 */
export const initialVariationDeliverablesState: VariationDeliverablesState = {
  deliverables: [],
  loading: false,
  error: null,
  isReadOnly: false,
  lookupDataLoaded: false
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
    // Basic state management actions
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
      
    case 'SET_LOOKUP_DATA_LOADED':
      return { ...state, lookupDataLoaded: action.payload };
    
    // Fetch operations
    case 'FETCH_DELIVERABLES_START':
      return { ...state, loading: true, error: null };
    
    case 'FETCH_DELIVERABLES_SUCCESS':
      return { ...state, loading: false, deliverables: action.payload, error: null };
    
    case 'FETCH_DELIVERABLES_ERROR':
      return { ...state, loading: false, error: action.payload };
    
    // Add operations
    case 'ADD_DELIVERABLE_START':
      return { ...state, loading: true, error: null };
    
    case 'ADD_DELIVERABLE_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        deliverables: [...state.deliverables, action.payload],
        error: null
      };
    
    case 'ADD_DELIVERABLE_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload.error 
      };
    
    // Delete operations
    case 'DELETE_DELIVERABLE_START':
      return { ...state, loading: true, error: null };
    
    case 'DELETE_DELIVERABLE_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        deliverables: state.deliverables.filter(d => d.guid !== action.payload),
        error: null
      };
    
    case 'DELETE_DELIVERABLE_ERROR':
      return { 
        ...state, 
        loading: false, 
        error: action.payload.error 
      };
      
    default:
      return state;
  }
};
