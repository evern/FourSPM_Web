import { Deliverable } from '../../types/odata-types';
import { GridOperationsHook, ValidationRule, GridOperationsConfig, ProjectScopedGridController } from '../interfaces/grid-operation-hook.interfaces';
import { EntityHook } from '../interfaces/entity-hook.interfaces';
import { getSuggestedDocumentNumber } from '../../adapters/deliverable.adapter';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { createEntityHook } from '../factories/createEntityHook';
import { GridUtils } from '../interfaces/grid-utils.interface';
import { useGridUtils } from '../utils/useGridUtils';
import { useProjectInfo } from '../utils/useProjectInfo';
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useState } from 'react';

/**
 * Default validation rules for deliverables
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
   * @returns A promise resolving to the suggested document number
   */
  fetchSuggestedDocumentNumber: (
    deliverableTypeId: string,
    areaNumber: string, 
    discipline: string, 
    documentType: string
  ) => Promise<string>;
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
  
  // Use dedicated project info hook for project data
  const { project, isLoading: isProjectLoading } = useProjectInfo(projectId, userToken);
  
  // Use the grid utils hook for grid functionality
  const { setCellValue, handleGridInitialized } = useGridUtils();
  
  // Enhanced grid init handler that updates both the hook and local state
  const handleGridInit = useCallback((e: any) => {
    handleGridInitialized(e);     // Also update the hook's instance
  }, [handleGridInitialized]);
  
  /**
   * Handler for initializing a new row with default values for deliverables
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Set default values for new deliverable
      e.data.projectId = projectId;
      e.data.id = uuidv4(); // Generate a new ID
      e.data.status = 'New';
      
      // Add any other default values needed
      if (project) {
        e.data.client = project.client;
      }
    }
  }, [projectId, project]);
  
  /**
   * Fetches a suggested document number based on the provided parameters
   */
  const fetchSuggestedDocumentNumber = useCallback(async (
    deliverableTypeId: string,
    areaNumber: string,
    discipline: string,
    documentType: string
  ): Promise<string> => {
    try {
      // Call the adapter function to get the suggested number from the backend
      const suggestedNumber = await getSuggestedDocumentNumber(
        projectId || '',
        deliverableTypeId,
        areaNumber,
        discipline,
        documentType,
        userToken || ''
      );
      
      return suggestedNumber || '';
    } catch (error) {
      console.error('Error fetching suggested document number:', error);
      return '';
    }
  }, [projectId, userToken]);
  
  /**
   * Handler for editor preparing event - adds custom behaviors to the form fields
   */
  const handleEditorPreparing = useCallback((e: any) => {
    // Save the original setValue function to call it later
    const originalSetValue = e.editorOptions?.onValueChanged;
    const dataField = e.dataField;
    const editorOptions = e.editorOptions || {};
    const row = e.row;
    
    // Set the initial value for new rows or apply conditional logic
    if (dataField && row?.isNewRow) {
      // For new rows, pre-populate data from project
      if (dataField === 'projectGuid' && projectId) {
        editorOptions.value = projectId;
        editorOptions.disabled = true;
      }
      
      // Auto-generate GUID for new rows
      if (dataField === 'guid') {
        editorOptions.value = uuidv4();
      }
    }
    
    // Setup field change watchers for fields that affect document numbering
    if (['areaNumber', 'discipline', 'documentType', 'deliverableTypeId'].includes(dataField)) {
      editorOptions.onValueChanged = async (args: any) => {
        // Call the original handler first
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // Get current values from the row data
        const rowData = row.data;
        const deliverableTypeId = dataField === 'deliverableTypeId' ? args.value : rowData.deliverableTypeId;
        const areaNumber = dataField === 'areaNumber' ? args.value : rowData.areaNumber;
        const discipline = dataField === 'discipline' ? args.value : rowData.discipline;
        const documentType = dataField === 'documentType' ? args.value : rowData.documentType;
        
        // Only attempt to generate a document number if we have enough required fields
        // Using numeric enum values from the backend (3 = Deliverable)
        const shouldGenerateNumber = 
          deliverableTypeId !== undefined && 
          ((deliverableTypeId === 3 && areaNumber) || deliverableTypeId !== 3) &&
          (discipline || documentType)
        ;
        
        if (shouldGenerateNumber) {
          // Use the hook's fetchSuggestedDocumentNumber method
          const suggestedNumber = await fetchSuggestedDocumentNumber(
            deliverableTypeId.toString(), 
            areaNumber, 
            discipline, 
            documentType
          );
          
          if (suggestedNumber) {
            try {
              // Store the suggested number directly in row.data first
              row.data.internalDocumentNumber = suggestedNumber;
              
              // Use setCellValue from useGridUtils (abstracted grid functionality)
              const success = setCellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
            } catch (error) {
              console.error('Error setting internal document number:', error);
            }
          }
        }
      };
      return;
    }
    
    // For internal document number, provide the ability to manually refresh the suggested number
    if (dataField === 'internalDocumentNumber') {
      // Only apply buttons if we have a proper row data object
      if (row && row.data) {
        // Add a button to manually refresh the document number if needed
        editorOptions.buttons = [
          {
            name: 'suggestNumber',
            location: 'after',
            options: {
              icon: 'refresh',
              type: 'normal',
              hint: 'Generate document number',
              onClick: async () => {
                try {
                  if (row?.data) {
                    // Get current values from the row data
                    const deliverableTypeId = row.data.deliverableTypeId;
                    const areaNumber = row.data.areaNumber;
                    const discipline = row.data.discipline;
                    const documentType = row.data.documentType;
                    
                    // Only attempt to generate if we have the necessary data
                    if (deliverableTypeId !== undefined && 
                       ((deliverableTypeId === 3 && areaNumber) || deliverableTypeId !== 3) &&
                       (discipline || documentType)) {
                      
                      const suggestedNumber = await fetchSuggestedDocumentNumber(
                        deliverableTypeId.toString(),
                        areaNumber,
                        discipline,
                        documentType
                      );
                      
                      if (suggestedNumber) {
                        // Update both the editor and the underlying data
                        if (e.editorElement) {
                          try {
                            e.editorElement.dxTextBox('instance').option('value', suggestedNumber);
                          } catch (err) {
                            console.warn('Could not directly update editor:', err);
                          }
                        }
                        
                        // Store the suggested number directly in row.data
                        row.data.internalDocumentNumber = suggestedNumber;
                        
                        // Use setCellValue from useGridUtils (abstracted grid functionality)
                        const success = setCellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
                      }
                    } else {
                      console.warn('Cannot generate number: Missing required fields');
                    }
                  }
                } catch (error) {
                  console.error('Error generating document number:', error);
                }
              }
            }
          }
        ];
      }
    }
    
    // Handle special fields that need custom behavior
    if (dataField === 'deliverableTypeId') {
      // Override onValueChanged to update other fields when deliverable type changes
      editorOptions.onValueChanged = (args: any) => {
        // Call the original setValue function if it exists
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // If this is a Deliverable, task or regular ICR document, handle it differently
        // Note that we're now using number enum values: 0: Task, 1: NonDeliverable, 2: DeliverableICR, 3: Deliverable
        const isDeliverableOrICR = args.value === 2 || args.value === 3;
        
        // Get the form instance
        const form = e.component;
        
        // Make certain fields required based on deliverable type
        const editors = form.getEditor('areaNumber');
        if (editors) {
          editors.option('disabled', !isDeliverableOrICR);
        }
      };
    }
  }, [projectId, fetchSuggestedDocumentNumber]);
  
  // Return the enhanced hook with project context and grid utilities
  return {
    ...baseHook,
    project,
    isProjectLoading,
    handleEditorPreparing,
    handleInitNewRow,
    fetchSuggestedDocumentNumber,
    setCellValue,
    handleGridInitialized: handleGridInit
  };
}
