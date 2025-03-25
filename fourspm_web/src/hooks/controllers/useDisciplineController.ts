import { getDisciplines, getDisciplineDetails } from '../../adapters/discipline.adapter';
import { Discipline } from '../../types/index';
import { createCollectionHook } from '../factories/createCollectionHook';
import { createEntityHook } from '../factories/createEntityHook';
import { GridEnabledCollectionHook, ValidationRule, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { EntityHook } from '../interfaces/entity-hook.interfaces';

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
export interface DisciplineControllerHook extends GridEnabledCollectionHook<Discipline>, EntityHook<Discipline> {
  // This hook provides all grid operation handlers required by GridEnabledCollectionHook
  // and standard entity functionality
}

/**
 * Hook to manage discipline data operations
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing discipline data state and handler functions
 */
export const useDisciplineController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DISCIPLINE_VALIDATION_RULES
): DisciplineControllerHook => {
  // Create collection hook for disciplines with integrated grid operations and validation
  const collectionHook = createCollectionHook<Discipline>({
    services: {
      // Use FilterOptions directly from createCollectionHook
      getAll: (_options, token) => {
        if (!token) throw new Error('Token is required');
        return getDisciplines(token);
      }
    },
    callbacks: {
      onError: (error, operation) => {
        console.error(`Error in Discipline operation (${operation}):`, error);
      },
      // Spread all grid operation callbacks directly
      ...gridConfig
    },
    validationRules // Pass validation rules directly to the collection hook
  }, userToken, true) as GridEnabledCollectionHook<Discipline>;
  
  // Create entity hook for a single discipline
  const entityHook = createEntityHook<Discipline>({
    services: {
      getById: (id, token) => getDisciplineDetails(id, token || '')
    }
  }, userToken);
  
  // Return the combined hooks with all required functionality
  return {
    ...collectionHook,
    ...entityHook
  };
};
