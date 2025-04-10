import { useCallback } from 'react';
import { getSuggestedDocumentNumber } from '../../adapters/deliverable.adapter';
import { deliverableTypeEnum } from '../../types/enums';
import { v4 as uuidv4 } from 'uuid';

/**
 * These fields are calculated by the backend and should always be read-only
 * Used by deliverable-related controllers to determine field editability
 */
export const ALWAYS_READONLY_DELIVERABLE_FIELDS = [
  'bookingCode',
  'clientNumber',
  'projectNumber',
  'totalHours'
];

export interface useDeliverableGridEditorProps<TStatus = string> {
  projectGuid: string;
  userToken?: string;
  isFieldEditable: (fieldName: string, uiStatus: TStatus) => boolean;
  setCellValue: (rowIndex: number, dataField: string, value: any) => void;
  onError?: (error: any) => void;
  /**
   * Whether to enable row initialization logic (setting projectGuid, generating guid)
   * Default is false to maintain backward compatibility
   */
  enableRowInitialization?: boolean;
  /**
   * Optional project data for enhanced row initialization
   */
  project?: any;
  /**
   * Whether this editor is for variation deliverables
   * When true, document numbers will use XXX instead of sequence numbers
   */
  isVariation?: boolean;
}

/**
 * Hook for handling document number generation and editor preparing for deliverable fields
 */
export const useDeliverableGridEditor = <TStatus = string>({
  projectGuid,
  userToken,
  isFieldEditable,
  setCellValue,
  onError,
  enableRowInitialization = false,
  project,
  isVariation = false
}: useDeliverableGridEditorProps<TStatus>) => {
  /**
   * Gets default values for a new deliverable based on the current context
   * Creates a properly typed base object with all required non-nullable fields
   */
  const getDefaultDeliverableValues = useCallback(() => {
    // Base default values all deliverables should have with proper types
    const defaultValues: Record<string, any> = {
      // Core identifiers
      guid: uuidv4(),
      projectGuid,
      
      // Required string fields with default values
      departmentId: 'Design',
      deliverableTypeId: 'Deliverable', // Hardcoded default deliverable type
      documentType: '',
      clientDocumentNumber: '',
      discipline: '',
      areaNumber: '',
      
      // Required numeric fields with default values
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,
      totalCost: 0
    };
    
    return defaultValues;
  }, [projectGuid]);

  /**
   * Shared handler for initializing a new row with default values
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Apply default values first
      const defaultValues = getDefaultDeliverableValues();
      Object.assign(e.data, defaultValues);
      
      // Add project-related fields if available
      if (project) {
        // Extract client number if available
        if (project.client) {
          e.data.clientNumber = project.client.number || '';
        }
        
        // Extract project number if available
        if (project.projectNumber) {
          e.data.projectNumber = project.projectNumber || '';
        }
      }
    }
  }, [getDefaultDeliverableValues, project]);

  
  /**
   * Fetches a suggested document number based on deliverable details
   */
  const fetchSuggestedDocumentNumber = useCallback(async (
    deliverableTypeId: string | number,
    areaNumber: string, 
    discipline: string, 
    documentType: string,
    currentDeliverableGuid?: string
  ): Promise<string> => {
    try {
      if (!projectGuid) {
        return '';
      }
      
      // Convert to string for consistency with API call
      const deliverableTypeIdStr = deliverableTypeId?.toString() || '';
      
      const suggestedNumber = await getSuggestedDocumentNumber(
        projectGuid,
        deliverableTypeIdStr,
        areaNumber, 
        discipline, 
        documentType,
        userToken || '',
        currentDeliverableGuid 
      );
      
      // If this is a variation deliverable, replace the numerical suffix with XXX
      if (isVariation && suggestedNumber) {
        // Find the last dash followed by numbers and replace with XXX
        return suggestedNumber.replace(/(-\d+)$/, '-XXX');
      }
      
      return suggestedNumber;
    } catch (error) {
      console.error('Error fetching suggested document number:', error);
      if (onError) {
        onError(error);
      }
      return '';
    }
  }, [projectGuid, userToken, onError, isVariation]);

  /**
   * Handles editor preparing for deliverable fields, including automatic document number generation
   * and field enabling/disabling based on deliverable type
   */
  const handleEditorPreparing = useCallback((e: any) => {
    const originalSetValue = e.editorOptions?.onValueChanged;
    const dataField = e.dataField;
    const editorOptions = e.editorOptions || {};
    const row = e.row;
    
    if (e.dataField && e.row && e.row.data) {
      const { uiStatus } = e.row.data;
      
      e.editorOptions.readOnly = !isFieldEditable(dataField, uiStatus);
    }
    
    // Handle row initialization if enabled
    if (enableRowInitialization && dataField && row?.isNewRow) {
      // For new rows, pre-populate projectGuid
      if (dataField === 'projectGuid' && projectGuid) {
        editorOptions.value = projectGuid;
        editorOptions.disabled = true;
      }
      
      // Auto-generate GUID for new rows
      if (dataField === 'guid') {
        editorOptions.value = uuidv4();
      }
    }
    
    // Special handling for the deliverableTypeId field
    if (dataField === 'deliverableTypeId') {
      // Override onValueChanged to update other fields when deliverable type changes
      editorOptions.onValueChanged = (args: any) => {
        // Call the original setValue function if it exists
        if (originalSetValue) {
          originalSetValue(args);
        }

        // Also trigger document number generation logic
        updateDocumentNumber(row, args.value, row.data.areaNumber, row.data.discipline, row.data.documentType);
      };
    }
    
    // Add document number generation to relevant fields
    if (['areaNumber', 'discipline', 'documentType'].includes(dataField)) {
      editorOptions.onValueChanged = async (args: any) => {
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // Get current values for document number generation
        const deliverableTypeId = row.data.deliverableTypeId;
        const areaNumber = dataField === 'areaNumber' ? args.value : row.data.areaNumber;
        const discipline = dataField === 'discipline' ? args.value : row.data.discipline;
        const documentType = dataField === 'documentType' ? args.value : row.data.documentType;
        
        updateDocumentNumber(row, deliverableTypeId, areaNumber, discipline, documentType);
      };
    }
    
    // Special handling for the document number field - add a suggest button
    if (dataField === 'internalDocumentNumber' && !editorOptions.buttons) {
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
                  
                  updateDocumentNumber(row, deliverableTypeId, areaNumber, discipline, documentType);
                }
              } catch (error) {
                console.error('Error generating document number:', error);
                if (onError) onError(error);
              }
            }
          }
        }
      ];
    }
  }, [isFieldEditable, setCellValue, onError, enableRowInitialization, projectGuid]);

  /**
   * Helper function to update document number based on current values
   * Extracts common logic for document number generation
   */
  const updateDocumentNumber = useCallback(async (
    row: any,
    deliverableTypeId: any,
    areaNumber: string,
    discipline: string,
    documentType: string
  ) => {
    // Check if we have sufficient data to generate a number
    const isDeliverableType = 
      deliverableTypeId === 'Deliverable' || 
      deliverableTypeId === 3 || 
      deliverableTypeId === '3';
    
    const shouldGenerateNumber = 
      deliverableTypeId !== undefined && 
      ((isDeliverableType && areaNumber) || !isDeliverableType) &&
      (discipline || documentType);
    
    if (shouldGenerateNumber) {
      const suggestedNumber = await fetchSuggestedDocumentNumber(
        deliverableTypeId, 
        areaNumber, 
        discipline, 
        documentType,
        row.data?.guid 
      );
      
      if (suggestedNumber) {
        try {
          // Update both the row data and the grid
          row.data.internalDocumentNumber = suggestedNumber;
          setCellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
          
          // If there's an editor element, update it directly
          const editor = row.component?.getEditor('internalDocumentNumber');
          if (editor) {
            try {
              editor.option('value', suggestedNumber);
            } catch (err) {
              console.warn('Could not update editor directly:', err);
            }
          }
        } catch (error) {
          if (onError) onError(error);
        }
      }
    }
  }, [fetchSuggestedDocumentNumber, setCellValue, onError]);

  return {
    // Document number generation functions
    fetchSuggestedDocumentNumber,
    updateDocumentNumber,
    
    // Editor configuration function
    handleEditorPreparing,
    
    // Row initialization functions
    getDefaultDeliverableValues,
    handleInitNewRow
  };
};
