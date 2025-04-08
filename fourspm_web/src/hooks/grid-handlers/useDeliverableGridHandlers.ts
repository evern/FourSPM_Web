import { useCallback } from 'react';
import { useDeliverableGridEditor, ALWAYS_READONLY_DELIVERABLE_FIELDS } from '../grid-editors/useDeliverableGridEditor';
import { useGridUtils } from '../utils/useGridUtils';
// Using the explicit validator from grid-handlers folder
import { useDeliverableGridValidator, GridRowEvent, ValidationResult } from './useDeliverableGridValidator';

/**
 * Interface defining comprehensive grid event handlers for deliverables
 */
export interface DeliverableGridHandlers {
  // DevExtreme grid event handlers
  handleRowValidating: (e: GridRowEvent) => void;
  handleRowUpdating: (e: GridRowEvent) => void;
  handleRowInserting: (e: GridRowEvent) => void;
  handleRowRemoving: (e: GridRowEvent) => void;
  handleInitNewRow: (e: GridRowEvent) => void;
  handleEditorPreparing: (e: { component: any; element: any; model: any; editorOptions: any; editorName: string; dataField: string; row: any; parentType: string; }) => void;
  handleGridInitialized: (e: { component: any; element: any; }) => void;
  
  // Utility methods
  setCellValue: (rowIndex: number, fieldName: string, value: any) => boolean;
  validateDeliverable: (deliverable: Record<string, any>) => ValidationResult;
}

/**
 * Hook for managing deliverable grid event handlers
 * @param options Configuration options for grid handlers
 * @returns Object containing all grid event handlers
 */
export function useDeliverableGridHandlers(options: {
  projectGuid?: string;
  userToken?: string;
}): DeliverableGridHandlers {
  const { projectGuid, userToken } = options;
  
  // Get grid utility methods
  const { setCellValue, handleGridInitialized } = useGridUtils();
  
  /**
   * Defines which fields are editable based on the deliverable status
   */
  const isFieldEditable = useCallback((fieldName: string, uiStatus?: string) => {
    // Use the shared readonly fields list
    if (ALWAYS_READONLY_DELIVERABLE_FIELDS.includes(fieldName)) {
      return false;
    }
    return true; // All other fields are editable by default
  }, []);
  
  // Use the deliverable grid editor for document number handling and field customization
  const { 
    handleEditorPreparing, 
    handleInitNewRow: baseHandleInitNewRow
  } = useDeliverableGridEditor<string>({
    projectGuid: projectGuid || '',
    userToken: userToken || '',
    isFieldEditable,
    setCellValue,
    enableRowInitialization: true
  });
  
  // Use the shared entity validator for validation logic
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    validateDeliverable: validatorFunction
  } = useDeliverableGridValidator({
    projectGuid,
    userToken
  });

  // Use the validator's validateDeliverable function directly
  const validateDeliverable = useCallback((deliverable: any) => {
    return validatorFunction(deliverable);
  }, [validatorFunction]);
  
  // Handle row removal confirmation - kept the same as original
  const handleRowRemoving = useCallback((e: any) => {
    // No special handling for removal at this level
    // Any confirmation dialog would be handled at the UI level
  }, []);
  
  // Handle initializing a new row - kept this from the original implementation
  // because it has specific integration with baseHandleInitNewRow
  const handleInitNewRow = useCallback((e: any) => {
    // Use the base implementation from the grid editor
    baseHandleInitNewRow(e);
    
    // Ensure project guid is set
    if (projectGuid) {
      e.data.projectGuid = projectGuid;
    }
  }, [baseHandleInitNewRow, projectGuid]);
  
  // Keep using handleEditorPreparing directly from useDeliverableGridEditor
  // which matches the implementation in the original deliverables.tsx
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleEditorPreparing,
    setCellValue,
    handleGridInitialized,
    // Use the validateDeliverable from our validator
    validateDeliverable
  };
}
