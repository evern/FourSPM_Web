import { useCallback } from 'react';
import { ValidationRule } from '../interfaces/grid-operation-hook.interfaces';

/**
 * Options for entity validation
 */
export interface EntityValidatorOptions<T> {
  /** Validation rules for the entity */
  validationRules: ValidationRule[];
  /** Optional project GUID for entity context */
  projectGuid?: string;
  /** Custom validation function if needed */
  customValidator?: (entity: Partial<T>) => { isValid: boolean; errors: Record<string, string> };
}

/**
 * Interface for validation handlers returned by the hook
 */
export interface EntityValidationHandlers {
  /** Handler for DevExtreme row validating event */
  handleRowValidating: (e: any) => void;
  /** Handler for row update validation */
  validateRowUpdate: (oldData: any, newData: any) => { isValid: boolean; errors: Record<string, string> };
  /** Handler for validating a full entity */
  validateEntity: (entity: any) => { isValid: boolean; errors: Record<string, string> };
}

/**
 * A shared validation utility hook that can be used across different entity types
 * (like projects, deliverables, etc.) to provide consistent validation behavior.
 * 
 * @template T The entity type (project, deliverable, etc.)
 * @param options Validation options including rules and context
 * @returns Standardized validation handlers
 */
export function useEntityValidator<T>(options: EntityValidatorOptions<T>): EntityValidationHandlers {
  const { validationRules, projectGuid, customValidator } = options;
  
  /**
   * Validates an entity against the provided validation rules
   * @param entity The entity to validate
   * @returns Validation result with isValid flag and errors object
   */
  const validateEntity = useCallback((entity: any) => {
    // Start with valid assumption and empty errors
    let isValid = true;
    const errors: Record<string, string> = {};
    
    // If there's a custom validator, use it first
    if (customValidator) {
      const customResult = customValidator(entity);
      // If custom validation fails, return those errors immediately
      if (!customResult.isValid) {
        return customResult;
      }
    }
    
    // Validate against each rule
    for (const rule of validationRules) {
      const { field, required, pattern, maxLength, minLength, min, max, errorText } = rule;
      const value = entity[field];
      
      // Check if field is required
      if (required && (value === undefined || value === null || value === '')) {
        errors[field] = errorText || `${field} is required`;
        isValid = false;
        continue;
      }
      
      // Skip further validation if value is empty and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }
      
      // Check pattern if specified
      if (pattern && !pattern.test(value.toString())) {
        errors[field] = errorText || `${field} format is invalid`;
        isValid = false;
        continue;
      }
      
      // Check max length if specified
      if (maxLength !== undefined && value.toString().length > maxLength) {
        errors[field] = errorText || `${field} must be at most ${maxLength} characters`;
        isValid = false;
        continue;
      }
      
      // Check min length if specified
      if (minLength !== undefined && value.toString().length < minLength) {
        errors[field] = errorText || `${field} must be at least ${minLength} characters`;
        isValid = false;
        continue;
      }
      
      // Check min value if specified
      if (min !== undefined && parseFloat(value) < min) {
        errors[field] = errorText || `${field} must be at least ${min}`;
        isValid = false;
        continue;
      }
      
      // Check max value if specified
      if (max !== undefined && parseFloat(value) > max) {
        errors[field] = errorText || `${field} must be at most ${max}`;
        isValid = false;
        continue;
      }
    }
    
    return { isValid, errors };
  }, [validationRules, customValidator]);
  
  /**
   * Validates specific changes during row updates
   * This is useful for cell editing where only certain fields are modified
   */
  const validateRowUpdate = useCallback((oldData: any, newData: any) => {
    // Create a merged entity with the updated fields
    const updatedEntity = { ...oldData, ...newData };
    
    // Validate the complete entity
    return validateEntity(updatedEntity);
  }, [validateEntity]);
  
  /**
   * Handler for DevExtreme grid's onRowValidating event
   * Follows the pattern used in createGridOperationHook
   */
  const handleRowValidating = useCallback((e: any) => {
    // Skip validation if no data is present
    if (!e.newData) return;
    
    // If this is a new row, set the projectGuid automatically if available
    if (!e.oldData && projectGuid) {
      e.newData.projectGuid = projectGuid;
    }
    
    // For cell editing, we need to check if it's just modifying a few fields
    const isCellEditing = e.oldData && Object.keys(e.newData).length < 5;
    
    if (isCellEditing) {
      // For cell editing, only validate the fields being edited
      const fieldsBeingEdited = Object.keys(e.newData);
      
      // Validate using merged data
      const mergedData = { ...e.oldData, ...e.newData };
      const { errors } = validateEntity(mergedData);
      
      // Check if any of the edited fields have errors
      const relevantErrors = fieldsBeingEdited.filter(field => errors[field]);
      
      if (relevantErrors.length > 0) {
        // Mark as invalid and show the first error
        const firstErrorField = relevantErrors[0];
        e.isValid = false;
        e.errorText = errors[firstErrorField];
        return;
      }
    } else {
      // For full row validation (row editing, new rows), validate all fields
      for (const rule of validationRules) {
        // Get value from either newData or oldData
        const value = e.newData && e.newData[rule.field] !== undefined ? 
          e.newData[rule.field] : 
          (e.oldData ? e.oldData[rule.field] : undefined);
        
        // Check if field is required
        if (rule.required && (value === undefined || value === null || value === '')) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} is required`;
          return; 
        }
  
        // Check pattern if provided
        if (value && rule.pattern && !rule.pattern.test(value.toString())) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} format is invalid`;
          return;
        }
        
        // Check max length constraint
        if (value && rule.maxLength && value.toString().length > rule.maxLength) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be less than ${rule.maxLength} characters`;
          return;
        }
      }
    }
    
    // If we got here, validation passed
    e.isValid = true;
  }, [projectGuid, validationRules, validateEntity]);
  
  return {
    handleRowValidating,
    validateRowUpdate,
    validateEntity
  };
}
