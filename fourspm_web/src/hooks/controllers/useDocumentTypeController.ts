import { getDocumentTypes, getDocumentTypeDetails } from '../../adapters/document-type.adapter';
import { DocumentType } from '../../types/index';
import { createCollectionHook } from '../factories/createCollectionHook';
import { createEntityHook } from '../factories/createEntityHook';
import { GridEnabledCollectionHook, ValidationRule, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { EntityHook } from '../interfaces/entity-hook.interfaces';

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
export interface DocumentTypeControllerHook extends GridEnabledCollectionHook<DocumentType>, EntityHook<DocumentType> {
  // This hook provides only the standard collection and entity functionality
  // No additional document type-specific properties needed
}

/**
 * Hook to manage document type data operations
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing document type data state and handler functions
 */
export const useDocumentTypeController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DOCUMENT_TYPE_VALIDATION_RULES
): DocumentTypeControllerHook => {
  // Create collection hook for document types with grid operations and validation
  const collectionHook = createCollectionHook<DocumentType>({
    services: {
      // Use FilterOptions directly from createCollectionHook
      getAll: (_options, token) => {
        if (!token) throw new Error('Token is required');
        return getDocumentTypes(token);
      }
    },
    callbacks: {
      onError: (error, operation) => {
        console.error(`Error in DocumentType operation (${operation}):`, error);
      },
      // Spread all grid operation callbacks directly
      ...gridConfig
    },
    validationRules // Pass validation rules to the collection hook
  }, userToken, true) as GridEnabledCollectionHook<DocumentType>;
  
  // Create entity hook for a single document type
  const entityHook = createEntityHook<DocumentType>({
    services: {
      getById: (id, token) => getDocumentTypeDetails(id, token || '')
    }
  }, userToken);
  
  return {
    ...collectionHook,
    ...entityHook
  };
};
