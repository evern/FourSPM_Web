import { DocumentType } from '../../types/index';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { v4 as uuidv4 } from 'uuid';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';

/**
 * Default validation rules for document types
 */
const DEFAULT_DOCUMENT_TYPE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'code', 
    required: true, 
    maxLength: 3,
    pattern: /^[A-Z]{1,3}$/,
    errorText: 'Code must be 1-3 uppercase letters' 
  },
  { 
    field: 'name', 
    required: false, 
    maxLength: 500,
    errorText: 'Name cannot exceed 500 characters' 
  }
];

/**
 * Interface for DocumentType data hook - combines collection and entity hooks with document type-specific functionality
 */
export interface DocumentTypeCollectionControllerHook extends GridOperationsHook<DocumentType> {
  handleInitNewRow: (e: any) => void;
}

/**
 * Hook to manage document type data operations
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing document type data state and handler functions
 */
export const useDocumentTypeCollectionController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DOCUMENT_TYPE_VALIDATION_RULES
): DocumentTypeCollectionControllerHook => {
  // Create collection hook for document types with grid operations and validation
  const collectionHook = createGridOperationHook<DocumentType>({
    // Spread all grid operation callbacks directly
    ...gridConfig,
    validationRules // Pass validation rules to the collection hook
  }, userToken) as GridOperationsHook<DocumentType>;
  
  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      code: '',
      name: ''
    };
  };

  return {
    ...collectionHook,
    handleInitNewRow
  };
};
