import { DeliverableEditorState, DeliverableEditorAction } from './deliverable-editor-types';

export const initialDeliverableEditorState: DeliverableEditorState = {
  isGeneratingDocumentNumber: false,
  error: null,
  deliverableFieldDependencies: {
    'deliverableTypeId': ['internalDocumentNumber'],
    'areaNumber': ['internalDocumentNumber'],
    'discipline': ['internalDocumentNumber'],
    'documentType': ['internalDocumentNumber']
  }
};

export function deliverableEditorReducer(
  state: DeliverableEditorState, 
  action: DeliverableEditorAction
): DeliverableEditorState {
  switch (action.type) {
    case 'SET_GENERATING_DOCUMENT_NUMBER':
      return {
        ...state,
        isGeneratingDocumentNumber: action.payload
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
