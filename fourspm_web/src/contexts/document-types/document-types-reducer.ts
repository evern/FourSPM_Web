import { DocumentTypesAction, DocumentTypesReducer, DocumentTypesState } from './document-types-types';

// Initial state for document types context
export const initialDocumentTypesState: DocumentTypesState = {
  loading: false,
  error: null,
  token: null
};

// Reducer for document types context
export const documentTypesReducer: DocumentTypesReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    default:
      return state;
  }
};
