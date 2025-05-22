import { VariationsState, VariationsAction } from './variations-types';

export const initialVariationsState: VariationsState = {
  // Data state
  variations: [],
  loading: false,
  error: null,
  token: null,
  validationErrors: {},
  
  // Editor state
  isProcessing: false,
  editorError: null,
  variationFieldDependencies: {}
};

export function variationsReducer(state: VariationsState, action: VariationsAction): VariationsState {
  switch (action.type) {
    // State management actions
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_DATA_LOADED':
      return { ...state, loading: !action.payload };
      
    // Token management
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
      
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
