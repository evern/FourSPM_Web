import { Deliverable } from '../../types/odata-types';
import { GridOperationsHook, ValidationRule, GridOperationsConfig, ProjectScopedGridController } from '../interfaces/grid-operation-hook.interfaces';
import { EntityHook } from '../interfaces/entity-hook.interfaces';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { createEntityHook } from '../factories/createEntityHook';
import { GridUtils } from '../interfaces/grid-utils.interface';
import { useGridUtils } from '../utils/useGridUtils';
import { useProjectInfo } from '../utils/useProjectInfo';
import { useDeliverableGridEditor, ALWAYS_READONLY_DELIVERABLE_FIELDS } from '../utils/useDeliverableGridEditor';
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useState } from 'react';

/**
 * Default validation rules for deliverables
 * Exported so they can be reused across deliverable-related controllers
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
 * Base interface for Deliverable data hook - combines collection and entity hooks with deliverable-specific functionality
 */
export interface DeliverableCollectionControllerHook extends GridOperationsHook<Deliverable>, EntityHook<Deliverable> {
}

/**
 * Project-specific deliverable controller interface with additional document handling functionality
 */
export interface ProjectDeliverableCollectionControllerHook extends DeliverableCollectionControllerHook, ProjectScopedGridController<Deliverable> {
  /**
   * Initialize new deliverable row with default values
   * @param e Row initialization event
   */
  handleInitNewRow: (e: any) => void;
  /**
   * Handles the editor preparing event for DevExtreme grid editors.
   * Customizes editor behavior, particularly for the internalDocumentNumber field
   * by adding a "Suggest Number" button to fetch and set a suggested document number.
   * @param e The editor preparing event
   */
  handleEditorPreparing: (e: any) => void;
  /**
   * Fetches a suggested document number based on the provided parameters.
   * Calls the backend adapter function to retrieve the suggested number.
   * @param deliverableTypeId The ID of the deliverable type
   * @param areaNumber The area number
   * @param discipline The discipline
   * @param documentType The document type
   * @param currentDeliverableGuid Optional GUID of the current deliverable to exclude from the calculation
   * @returns A promise resolving to the suggested document number
   */
  fetchSuggestedDocumentNumber: (
    deliverableTypeId: string,
    areaNumber: string, 
    discipline: string, 
    documentType: string,
    currentDeliverableGuid?: string
  ) => Promise<string>;
  /**
   * Helper function to update document number based on current values
   * @param row The row containing the deliverable data
   * @param deliverableTypeId The deliverable type ID
   * @param areaNumber The area number
   * @param discipline The discipline code
   * @param documentType The document type code
   */
  updateDocumentNumber: (
    row: any,
    deliverableTypeId: any,
    areaNumber: string,
    discipline: string,
    documentType: string
  ) => Promise<void>;
  // Grid utility method
  setCellValue: (rowIndex: number, fieldName: string, value: any) => boolean;
}

/**
 * Hook to manage deliverable data operations without project-specific functionality
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @param projectId Optional project ID to filter deliverables
 * @returns Object containing deliverable data state and handler functions
 */
export function useDeliverableCollectionController(
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DELIVERABLE_VALIDATION_RULES,
  projectId?: string
): DeliverableCollectionControllerHook {
  // Create collection hook for deliverable grid operations
  const collectionHook = createGridOperationHook<Deliverable>({
    ...gridConfig,
    validationRules // Pass validation rules to the collection hook
  }, userToken) as GridOperationsHook<Deliverable>;
  
  // Create entity hook for a single deliverable
  const entityHook = createEntityHook<Deliverable>({
    services: {
      // We don't need specific entity services at this point
    },
    callbacks: {
      // Handle any entity-specific callbacks here
      onError: (error, operation) => {
        console.error(`Error in Deliverable entity operation (${operation}):`, error);
      }
    }
  }, userToken);
  
  // Return the combined hooks with all required functionality
  return {
    ...collectionHook,
    ...entityHook
  };
}

/**
 * Hook to manage deliverable data operations with project functionality
 * @param userToken The user's authentication token
 * @param projectId The project ID to filter and create deliverables for
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules for deliverable fields
 * @returns Object containing deliverable data state and handler functions
 */
export function useProjectDeliverableCollectionController(
  userToken: string | undefined,
  projectId?: string,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DELIVERABLE_VALIDATION_RULES
): ProjectDeliverableCollectionControllerHook {
  // Use the base deliverable controller with standard functionality
  const baseHook = useDeliverableCollectionController(userToken, gridConfig, validationRules, projectId);
  
  // Use the project info hook to get details about the current project
  const { project, isLoading: isProjectLoading } = useProjectInfo(projectId, userToken);
  
  // Add grid utility methods for data manipulation
  const { setCellValue, handleGridInitialized } = useGridUtils();
  
  // Wrapper over grid initialization to store instance
  const handleGridInit = useCallback((e: any) => {
    handleGridInitialized(e);     // Also update the hook's instance
  }, [handleGridInitialized]);
  
  /**
   * Defines which fields are editable based on the deliverable status
   * 
   * @param fieldName The name of the field to check
   * @param uiStatus Optional status that can be used to determine editability
   * (e.g., could be used to lock budget hours for deliverables in certain states)
   */
  const isFieldEditable = useCallback((fieldName: string, uiStatus: string) => {
    // Use the shared readonly fields list
    if (ALWAYS_READONLY_DELIVERABLE_FIELDS.includes(fieldName)) {
      return false;
    }
    
    // Example of how uiStatus could be used to lock budget hours based on status
    // if (fieldName === 'budgetHours' && ['Completed', 'Approved'].includes(uiStatus)) {
    //   return false; // Lock budget hours for completed or approved deliverables
    // }
    
    // Add deliverable-specific editability rules here if needed
    return true; // All other fields are editable by default
  }, []);
  
  /**
   * Use the enhanced grid editor hook for all deliverable functionality including:
   * - Document number generation and management
   * - Row initialization with default values
   * - Editor preparation and field validation
   */
  const { 
    fetchSuggestedDocumentNumber, 
    handleEditorPreparing, 
    updateDocumentNumber,
    getDefaultDeliverableValues,
    handleInitNewRow
  } = useDeliverableGridEditor<string>({
    projectGuid: projectId || '',
    userToken,
    isFieldEditable,
    setCellValue,
    enableRowInitialization: true,
    project
  });

  
  // Return the enhanced hook with project context and grid utilities
  return {
    ...baseHook,
    project,
    isProjectLoading,
    handleEditorPreparing,
    handleInitNewRow,
    fetchSuggestedDocumentNumber,
    updateDocumentNumber,
    setCellValue,
    handleGridInitialized: handleGridInit
  };
}
