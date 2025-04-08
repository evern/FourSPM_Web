import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEntityValidator } from '../utils/useEntityValidator';
import { ValidationRule } from '../interfaces/grid-operation-hook.interfaces';

/**
 * Default validation rules for projects
 */
export const PROJECT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'projectNumber', required: true, maxLength: 50, errorText: 'Project Number is required' },
  { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
  { field: 'projectStatus', required: true, errorText: 'Project Status is required' },
  { field: 'clientGuid', required: true, errorText: 'Client is required' }
];

/**
 * Interface for project grid validation handlers
 */
export interface ProjectGridValidationHandlers {
  handleRowValidating: (e: any) => void;
  handleRowUpdating: (e: any) => void;
  handleRowInserting: (e: any) => void;
  validateProject: (project: any) => { isValid: boolean; errors: Record<string, string> };
}

/**
 * A specialized hook that uses the shared entity validator for projects.
 * This demonstrates how to use the entity validator in a specific context.
 * 
 * @param options Configuration including user token
 * @returns Standardized project validation handlers
 */
export function useProjectGridValidator(options: {
  userToken?: string;
}): ProjectGridValidationHandlers {
  // Use the shared entity validator with project-specific rules
  const {
    handleRowValidating,
    validateEntity,
    validateRowUpdate
  } = useEntityValidator({
    validationRules: PROJECT_VALIDATION_RULES,
  });
  
  // Alias for validateEntity that's specific to projects
  const validateProject = useCallback((project: any) => {
    return validateEntity(project);
  }, [validateEntity]);
  
  // Handle row updating with existing values
  const handleRowUpdating = useCallback((e: any) => {
    // In the original implementation, no explicit validation is needed here
    // as handleRowValidating will be called by DevExtreme
    console.log('Updating project with data:', e.newData);
  }, []);
  
  // Handle row insertion with default values
  const handleRowInserting = useCallback((e: any) => {
    // Ensure we have a GUID for the new record
    e.data.guid = e.data.guid || uuidv4();
    
    // DevExtreme will call handleRowValidating automatically
    // so we don't need additional validation here
  }, []);
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    validateProject
  };
}
