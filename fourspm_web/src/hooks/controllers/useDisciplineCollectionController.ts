import { Discipline } from '../../types/index';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default validation rules for disciplines
 */
const DEFAULT_DISCIPLINE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'code', 
    required: true, 
    maxLength: 2,
    pattern: /^[A-Z][A-Z]$/,
    errorText: 'Code must be exactly 2 uppercase letters' 
  },
  { 
    field: 'name', 
    required: false, 
    maxLength: 500,
    errorText: 'Name cannot exceed 500 characters' 
  }
];

/**
 * Interface for Discipline data hook - combines collection and entity hooks with discipline-specific functionality
 */
export interface DisciplineCollectionControllerHook extends GridOperationsHook<Discipline> {
  handleInitNewRow: (e: any) => void;
}

/**
 * Hook to manage discipline data operations
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing discipline data state and handler functions
 */
export const useDisciplineCollectionController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DISCIPLINE_VALIDATION_RULES
): DisciplineCollectionControllerHook => {
  // Create collection hook for disciplines with integrated grid operations and validation
  const collectionHook = createGridOperationHook<Discipline>({
    // Spread all grid operation callbacks directly
    ...gridConfig,
    validationRules // Pass validation rules directly to the collection hook
  }, userToken) as GridOperationsHook<Discipline>;
  
  /**
   * Handler for initializing a new row with default values for disciplines
   * @param e The row init event object
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Set default values for new discipline
      e.data = {
        ...e.data,
        guid: uuidv4(),
        code: '',
        name: ''
      };
    }
  }, []);
  
  // Return the combined hooks with all required functionality
  return {
    ...collectionHook,
    handleInitNewRow
  };
};
