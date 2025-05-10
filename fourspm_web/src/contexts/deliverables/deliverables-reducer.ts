import { DeliverablesState, DeliverablesAction } from './deliverables-types';

/**
 * Initial state for the deliverables context
 */
export const initialDeliverablesState: DeliverablesState = {
  deliverables: [],
  loading: false,
  isProcessing: false,
  error: null,
  lookupDataLoaded: false,
  validationErrors: {},
  editorError: null
};

/**
 * Reducer function to handle state updates for deliverables
 * @param state Current state
 * @param action Action to perform
 * @returns Updated state
 */
export function deliverablesReducer(state: DeliverablesState, action: DeliverablesAction): DeliverablesState {
  switch (action.type) {
    // Fetch operations
    case 'FETCH_DELIVERABLES_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_DELIVERABLES_SUCCESS':
      return { ...state, loading: false, deliverables: action.payload };
    case 'FETCH_DELIVERABLES_ERROR':
      return { ...state, loading: false, error: action.payload };
      
    // Add operations
    case 'ADD_DELIVERABLE_START':
      return { ...state, isProcessing: true, error: null };
    case 'ADD_DELIVERABLE_SUCCESS':
      return { 
        ...state, 
        isProcessing: false, 
        deliverables: [...state.deliverables, action.payload],
        editorError: null
      };
    case 'ADD_DELIVERABLE_ERROR':
      return { 
        ...state, 
        isProcessing: false, 
        editorError: action.payload.error 
      };
      
    // Update operations
    case 'UPDATE_DELIVERABLE_START':
      return { ...state, isProcessing: true, error: null };
    case 'UPDATE_DELIVERABLE_SUCCESS':
      return { 
        ...state, 
        isProcessing: false, 
        deliverables: state.deliverables.map(d => 
          d.guid === action.payload.guid ? action.payload : d
        ),
        editorError: null
      };
    case 'UPDATE_DELIVERABLE_ERROR':
      return { 
        ...state, 
        isProcessing: false, 
        editorError: action.payload.error 
      };
      
    // Delete operations
    case 'DELETE_DELIVERABLE_START':
      return { ...state, isProcessing: true, error: null };
    case 'DELETE_DELIVERABLE_SUCCESS':
      return { 
        ...state, 
        isProcessing: false, 
        deliverables: state.deliverables.filter(d => d.guid !== action.payload),
        editorError: null
      };
    case 'DELETE_DELIVERABLE_ERROR':
      return { 
        ...state, 
        isProcessing: false, 
        editorError: action.payload.error 
      };
      
    // Validation operations
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    case 'CLEAR_VALIDATION_ERRORS':
      return { ...state, validationErrors: {} };
      
    // Editor operations
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_EDITOR_ERROR':
      return { ...state, editorError: action.payload };
      
    default:
      return state;
  }
}
