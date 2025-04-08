import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useEntityValidator } from '../utils/useEntityValidator';
import { ValidationRule } from '../interfaces/grid-operation-hook.interfaces';

/**
 * Default validation rules for deliverables
 */
export const DEFAULT_DELIVERABLE_VALIDATION_RULES: ValidationRule[] = [
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
  }
];

/**
 * Type compatible with DevExtreme grid row events for validation, insertion, updating, etc.
 * Structured to match the most common properties across DevExtreme event objects
 */
export interface GridRowEvent {
  // Data properties
  data?: Record<string, any>;
  newData?: Record<string, any>;
  oldData?: Record<string, any>;
  key?: any;
  
  // UI Component references
  component?: {
    option: (name: string) => any;
    focus: () => void;
    columnOption: (name: string, optionName: string, value: any) => void;
    element?: () => any;
  };
  element?: any;
  
  // Validation properties
  isValid?: boolean;
  brokenRules?: Array<{
    columnInfos?: Array<{ dataField: string }>;
    message: string | undefined;
    type: string;
    [key: string]: any;
  }> | any[]; // Support both our type and DevExtreme's rule types
  validationGroup?: any;
  errorText?: string;
  
  // Flow control
  promise?: Promise<any> | PromiseLike<void>;
  cancel?: boolean | PromiseLike<void>; // DevExtreme allows Promise here
}

/**
 * Type for validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Interface for deliverable grid validation handlers with improved typing
 */
export interface DeliverableGridValidationHandlers {
  handleRowValidating: (e: GridRowEvent) => void;
  handleRowUpdating: (e: GridRowEvent) => void;
  handleRowInserting: (e: GridRowEvent) => void;
  validateDeliverable: (deliverable: Record<string, any>) => ValidationResult;
}

/**
 * A specialized hook that uses the shared entity validator for deliverables.
 * This demonstrates how to use the entity validator in a specific context.
 * 
 * @param options Configuration including project GUID and user token
 * @returns Standardized deliverable validation handlers
 */
export function useDeliverableGridValidator(options: {
  projectGuid?: string;
  userToken?: string;
}): DeliverableGridValidationHandlers {
  const { projectGuid } = options;
  
  // Use the shared entity validator with deliverable-specific rules
  const {
    handleRowValidating,
    validateEntity,
    validateRowUpdate
  } = useEntityValidator({
    validationRules: DEFAULT_DELIVERABLE_VALIDATION_RULES,
    projectGuid
  });
  
  // Alias for validateEntity that's specific to deliverables
  const validateDeliverable = useCallback((deliverable: Record<string, any>): ValidationResult => {
    return validateEntity(deliverable);
  }, [validateEntity]);
  
  // Handle row updating with existing values
  const handleRowUpdating = useCallback((e: GridRowEvent) => {
    // In the original implementation, no explicit validation is needed here
    // as handleRowValidating will be called by DevExtreme
    console.log('Updating row with data:', e.newData);
  }, []);
  
  // Handle row insertion with default values
  const handleRowInserting = useCallback((e: GridRowEvent) => {
    if (e.data) {
      // Ensure we have a GUID for the new record
      e.data.guid = e.data.guid || uuidv4();
      
      // Ensure the project GUID is set
      if (projectGuid && !e.data.projectGuid) {
        e.data.projectGuid = projectGuid;
      }
    }
    
    // DevExtreme will call handleRowValidating automatically
    // so we don't need additional validation here
  }, [projectGuid]);
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    validateDeliverable
  };
}
