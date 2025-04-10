import { useCallback } from 'react';
import { ValidationRule } from '../interfaces/grid-operation-hook.interfaces';
import { Deliverable } from '@/types/odata-types';
import { VariationDeliverableUiStatus } from '@/types/app-types';
import { useEntityValidator } from '../utils/useEntityValidator';

/**
 * Default validation rules for variation deliverables
 */
const DEFAULT_DELIVERABLE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'areaNumber', 
    required: true, 
    maxLength: 2,
    pattern: /^[0-9][0-9]$/,
    errorText: 'Area Number must be exactly 2 digits (00-99)' 
  },
  { 
    field: 'discipline', 
    required: true,
    errorText: 'Discipline is required' 
  },
  { 
    field: 'documentType', 
    required: true,
    errorText: 'Document Type is required' 
  },
  { 
    field: 'deliverableTypeId', 
    required: true, 
    errorText: 'Deliverable Type is required'
  },
  { 
    field: 'documentTitle', 
    required: true, 
    maxLength: 500,
    errorText: 'Document Title is required and must be at most 500 characters' 
  },
  {
    field: 'variationHours',
    pattern: /^\d*\.?\d*$/,
    errorText: 'Variation Hours must be a non-negative number'
  }
];

/**
 * Props for the variation deliverable grid validator hook
 */
export interface UseVariationDeliverableGridValidatorProps {
  /**
   * Custom validation rules to apply in addition to the defaults
   */
  customValidationRules?: ValidationRule[];
  /**
   * Callback for validation errors
   */
  onValidationError?: (error: string) => void;
}

/**
 * Interface for validation handlers specific to variation deliverables
 */
export interface VariationDeliverableValidationHandlers {
  /** Handler for DevExtreme row validating event */
  handleRowValidating: (e: any) => void;
  /** Handler for validating a specific field */
  validateField: (fieldName: string, value: any, uiStatus?: VariationDeliverableUiStatus) => boolean;
  /** Access to full validation rules array */
  validationRules: ValidationRule[];
}

/**
 * Hook for validating variation deliverable grid data
 * Uses the shared entity validator but adds variation-specific validations
 */
export const useVariationDeliverableGridValidator = (
  props: UseVariationDeliverableGridValidatorProps = {}
): VariationDeliverableValidationHandlers => {
  const { customValidationRules = [], onValidationError } = props;
  
  // Combine standard and custom validation rules
  const allValidationRules = [...DEFAULT_DELIVERABLE_VALIDATION_RULES, ...customValidationRules];
  
  // Use the shared entity validator as base
  const { handleRowValidating: baseHandleRowValidating, validateEntity } = useEntityValidator({
    validationRules: allValidationRules,
    // Add custom variation-specific validator to handle UI status-based validation
    customValidator: (entity: Partial<Deliverable>) => {
      const errors: Record<string, string> = {};
      let isValid = true;
      
      // Get UI status to determine validation rules
      const uiStatus = entity.uiStatus as VariationDeliverableUiStatus || 'Original';
      
      // Special validation for variation hours
      if ('variationHours' in entity) {
        const hours = entity.variationHours;
        if (hours !== undefined && (isNaN(Number(hours)) || Number(hours) < 0)) {
          errors['variationHours'] = 'Variation hours must be a non-negative number';
          isValid = false;
        }
      }
      
      return { isValid, errors };
    }
  });
  
  /**
   * Enhanced row validation handler that considers UI status
   */
  const handleRowValidating = useCallback((e: any) => {
    if (!e.newData) return;
    
    // Get UI status to determine which fields should be validated
    const data = { ...e.oldData, ...e.newData };
    const uiStatus = data.uiStatus as VariationDeliverableUiStatus || 'Original';
    
    // For Original status, only validate variationHours if it was changed
    if (uiStatus === 'Original') {
      // Clear any other validation except for variationHours
      const keys = Object.keys(e.newData);
      if (keys.length === 1 && keys[0] === 'variationHours') {
        // Use the base validator
        baseHandleRowValidating(e);
      } else {
        // Skip validation for fields that shouldn't be editable
        e.isValid = true;
      }
      return;
    }
    
    // For other statuses, use the entity validator
    baseHandleRowValidating(e);
    
    // Additional validation check for UI status-specific rules
    if (e.isValid && (uiStatus === 'Add' || uiStatus === 'Edit')) {
      // Any additional status-specific validation can go here
    }
  }, [baseHandleRowValidating]);
  
  /**
   * Helper to validate individual fields based on UI status
   */
  const validateField = useCallback((
    fieldName: string, 
    value: any, 
    uiStatus: VariationDeliverableUiStatus = 'Original'
  ): boolean => {
    // For Original status, only variationHours should be editable
    if (uiStatus === 'Original' && fieldName !== 'variationHours') {
      return true;  // Skip validation for fields that shouldn't be editable
    }
    
    // Create a partial entity with just the field to validate
    const partialEntity = { [fieldName]: value, uiStatus };
    const { isValid, errors } = validateEntity(partialEntity);
    
    // Report errors if callback provided
    if (!isValid && onValidationError && errors[fieldName]) {
      onValidationError(errors[fieldName]);
    }
    
    return isValid;
  }, [validateEntity, onValidationError]);
  
  return {
    handleRowValidating,
    validateField,
    validationRules: allValidationRules
  };
};
