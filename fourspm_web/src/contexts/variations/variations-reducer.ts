import { VariationsState, VariationsAction } from './variations-types';

export const initialVariationsState: VariationsState = {
  // Data state
  variations: [],
  loading: false,
  error: null,
  validationErrors: {},
  
  // Editor state
  isProcessing: false,
  editorError: null,
  variationFieldDependencies: {}
};

export function variationsReducer(state: VariationsState, action: VariationsAction): VariationsState {
  switch (action.type) {
    case 'FETCH_VARIATIONS_START':
      return { ...state, loading: true, error: null };
    
    case 'FETCH_VARIATIONS_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        variations: action.payload,
        error: null
      };
    
    case 'FETCH_VARIATIONS_ERROR':
      return { ...state, loading: false, error: action.payload };
    
    case 'ADD_VARIATION_START':
      return { ...state, loading: true, error: null };
    
    case 'ADD_VARIATION_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        variations: [...state.variations, action.payload],
        error: null
      };
    
    case 'ADD_VARIATION_ERROR':
      return { ...state, loading: false, error: action.payload.error };
    
    case 'UPDATE_VARIATION_START':
      return { ...state, loading: true, error: null };
    
    case 'UPDATE_VARIATION_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        variations: state.variations.map(v => 
          v.guid === action.payload.guid ? action.payload : v
        ),
        error: null
      };
    
    case 'UPDATE_VARIATION_ERROR':
      return { ...state, loading: false, error: action.payload.error };
    
    case 'DELETE_VARIATION_START':
      return { ...state, loading: true, error: null };
    
    case 'DELETE_VARIATION_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        variations: state.variations.filter(v => v.guid !== action.payload),
        error: null
      };
    
    case 'DELETE_VARIATION_ERROR':
      return { ...state, loading: false, error: action.payload.error };
    
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.payload };
    
    case 'CLEAR_VALIDATION_ERRORS':
      return { ...state, validationErrors: {} };
    
    // Editor-related actions
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
      
    case 'SET_EDITOR_ERROR':
      return { ...state, editorError: action.payload };
      
    default:
      return state;
  }
}
