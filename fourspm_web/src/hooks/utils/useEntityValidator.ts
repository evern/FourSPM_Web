import { useCallback } from 'react';
import { ValidationRule } from '../interfaces/grid-operation-hook.interfaces';


export interface EntityValidatorOptions<T> {

  validationRules: ValidationRule[];

  projectGuid?: string;

  customValidator?: (entity: Partial<T>) => { isValid: boolean; errors: Record<string, string> };
}


export interface EntityValidationHandlers {

  handleRowValidating: (e: any) => void;

  validateRowUpdate: (oldData: any, newData: any) => { isValid: boolean; errors: Record<string, string> };

  validateEntity: (entity: any) => { isValid: boolean; errors: Record<string, string> };
}


export function useEntityValidator<T>(options: EntityValidatorOptions<T>): EntityValidationHandlers {
  const { validationRules, projectGuid, customValidator } = options;
  

  const validateEntity = useCallback((entity: any) => {

    let isValid = true;
    const errors: Record<string, string> = {};
    

    if (customValidator) {
      const customResult = customValidator(entity);

      if (!customResult.isValid) {
        return customResult;
      }
    }
    

    for (const rule of validationRules) {
      const { field, required, pattern, maxLength, minLength, min, max, errorText } = rule;
      const value = entity[field];
      
      // Check if field is required
      if (required && (value === undefined || value === null || value === '')) {
        errors[field] = errorText || `${field} is required`;
        isValid = false;
        continue;
      }
      

      if (value === undefined || value === null || value === '') {
        continue;
      }
      

      if (pattern && !pattern.test(value.toString())) {
        errors[field] = errorText || `${field} format is invalid`;
        isValid = false;
        continue;
      }
      

      if (maxLength !== undefined && value.toString().length > maxLength) {
        errors[field] = errorText || `${field} must be at most ${maxLength} characters`;
        isValid = false;
        continue;
      }
      

      if (minLength !== undefined && value.toString().length < minLength) {
        errors[field] = errorText || `${field} must be at least ${minLength} characters`;
        isValid = false;
        continue;
      }
      

      if (min !== undefined && parseFloat(value) < min) {
        errors[field] = errorText || `${field} must be at least ${min}`;
        isValid = false;
        continue;
      }
      

      if (max !== undefined && parseFloat(value) > max) {
        errors[field] = errorText || `${field} must be at most ${max}`;
        isValid = false;
        continue;
      }
    }
    
    return { isValid, errors };
  }, [validationRules, customValidator]);
  

  const validateRowUpdate = useCallback((oldData: any, newData: any) => {

    const updatedEntity = { ...oldData, ...newData };
    

    return validateEntity(updatedEntity);
  }, [validateEntity]);
  

  const handleRowValidating = useCallback((e: any) => {

    if (!e.newData) return;
    

    if (!e.oldData && projectGuid) {
      e.newData.projectGuid = projectGuid;
    }
    

    const isCellEditing = e.oldData && Object.keys(e.newData).length < 5;
    
    if (isCellEditing) {

      const fieldsBeingEdited = Object.keys(e.newData);
      

      const mergedData = { ...e.oldData, ...e.newData };
      const { errors } = validateEntity(mergedData);
      

      const relevantErrors = fieldsBeingEdited.filter(field => errors[field]);
      
      if (relevantErrors.length > 0) {

        const firstErrorField = relevantErrors[0];
        e.isValid = false;
        e.errorText = errors[firstErrorField];
        return;
      }
    } else {
      for (const rule of validationRules) {

        const value = e.newData && e.newData[rule.field] !== undefined ? 
          e.newData[rule.field] : 
          (e.oldData ? e.oldData[rule.field] : undefined);
        

        if (rule.required && (value === undefined || value === null || value === '')) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} is required`;
          return; 
        }
  

        if (value && rule.pattern && !rule.pattern.test(value.toString())) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} format is invalid`;
          return;
        }
        

        if (value && rule.maxLength && value.toString().length > rule.maxLength) {
          e.isValid = false;
          e.errorText = rule.errorText || `${rule.field} must be less than ${rule.maxLength} characters`;
          return;
        }
      }
    }
    

    e.isValid = true;
  }, [projectGuid, validationRules, validateEntity]);
  
  return {
    handleRowValidating,
    validateRowUpdate,
    validateEntity
  };
}
