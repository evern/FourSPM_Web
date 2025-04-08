import { useCallback } from 'react';
import { ValidationRule } from '../interfaces/grid-operation-hook.interfaces';
import { Variation } from '../../types/odata-types';
import { useEntityValidator } from '../utils/useEntityValidator';

/**
 * Default validation rules for variations
 */
const DEFAULT_VARIATION_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'name', 
    required: true, 
    maxLength: 500, 
    errorText: 'Name is required and must be less than 500 characters' 
  },
  { 
    field: 'comments', 
    required: false, 
    maxLength: 1000, 
    errorText: 'Comments must be less than 1000 characters' 
  }
];

/**
 * Hook for variation grid validation
 * Uses the shared entity validator for consistent validation across entity types
 */
export function useVariationGridValidator({
  userToken,
  validationRules = DEFAULT_VARIATION_VALIDATION_RULES,
  projectGuid
}: {
  userToken?: string;
  validationRules?: ValidationRule[];
  projectGuid?: string;
}) {
  // Use the shared entity validator with variation-specific rules
  const {
    handleRowValidating,
    validateEntity,
    validateRowUpdate
  } = useEntityValidator({
    validationRules,
    projectGuid
  });
  
  // Alias for validateEntity that's specific to variations
  const validateVariation = useCallback((variation: Record<string, any>) => {
    return validateEntity(variation);
  }, [validateEntity]);
  
  // Handle row updating with existing values
  const handleRowUpdating = useCallback((e: any) => {
    const result = validateRowUpdate(e.oldData, e.newData);
    
    e.isValid = result.isValid;
    
    if (!result.isValid) {
      // Set the first error found as the error text
      const firstErrorKey = Object.keys(result.errors)[0];
      e.errorText = result.errors[firstErrorKey];
      e.cancel = true;
    }
  }, [validateRowUpdate]);
  
  return {
    validateVariation,
    handleRowValidating,
    handleRowUpdating
  };
}
