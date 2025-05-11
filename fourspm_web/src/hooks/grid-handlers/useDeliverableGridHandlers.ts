import { useCallback, useRef } from 'react';
import { useDeliverables } from '../../contexts/deliverables/deliverables-context';

// Define the GridRowEvent type to match DevExtreme's grid row events
interface GridRowEvent {
  data?: any;
  key?: any;
  cancel?: boolean;
  isValid?: boolean;
  errorText?: string;
  oldData?: any;
  newData?: any;
}

/**
 * Interface defining comprehensive grid event handlers for deliverables
 */
export interface DeliverableGridHandlers {
  // DevExtreme grid event handlers
  handleRowValidating: (e: GridRowEvent) => void;
  handleInitNewRow: (e: GridRowEvent) => void;
  handleEditorPreparing: (e: { component: any; element: any; model: any; editorOptions: any; editorName: string; dataField: string; row: any; parentType: string; }) => void;
  handleGridInitialized: (e: { component: any; element: any; }) => void;
  
  // Utility methods
  setCellValue: (rowIndex: number, fieldName: string, value: any) => boolean;
}

interface UseDeliverableGridHandlersProps {
  projectGuid?: string;
  userToken?: string;
  project?: any;
}

/**
 * Hook for handling deliverable grid operations
 * Uses the deliverables context for initialization and validation
 */
export const useDeliverableGridHandlers = ({
  projectGuid,
  userToken,
  project
}: UseDeliverableGridHandlersProps) => {
  // Track the DataGrid instance for operations
  const gridRef = useRef<any>(null);
  
  // Get functionality from deliverables context
  const deliverables = useDeliverables();
  const { 
    initializeDeliverable, 
    generateDocumentNumber
  } = deliverables;
  
  // Function to handle grid initialized event
  const handleGridInitialized = useCallback((e: any) => {
    gridRef.current = e.component;
  }, []);
  
  
  // Removed unused isFieldEditable function
  
  // Custom implementation of handleRowValidating that uses the deliverables context
  const handleRowValidating = useCallback((e: GridRowEvent) => {
    // Skip validation if no data is present
    if (!e || !e.data) return;
    
    // Apply validation using the context's validateDeliverable
    const result = deliverables.validateDeliverable(e.data);
    
    if (!result.isValid) {
      e.isValid = false;
      // Format the error messages for display
      e.errorText = Object.values(result.errors).flat().join('\n');
    }
  }, [deliverables]);
  
  // No longer implementing handlers that aren't needed
  
  // Handle initializing a new row with project-specific data using context
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data && projectGuid) {
      // Use the context's initialize method which includes all required fields
      const defaultValues = initializeDeliverable(projectGuid, project);
      Object.assign(e.data, defaultValues);
    }
  }, [initializeDeliverable, projectGuid, project]);
  
  /**
   * Helper function to update document number in the grid
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
    
    if (shouldGenerateNumber && projectGuid) {
      try {
        // Use the context's generateDocumentNumber method
        const suggestedNumber = await generateDocumentNumber(
          deliverableTypeId, 
          areaNumber, 
          discipline, 
          documentType,
          row.data?.guid,
          false // Not a variation deliverable
        );
        
        if (suggestedNumber) {
          // Update both the row data and the grid
          row.data.internalDocumentNumber = suggestedNumber;
          
          // Use the gridRef since it's more reliable with virtual scrolling
          gridRef.current?.cellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
        }
      } catch (error) {
        console.error('Error generating document number:', error);
      }
    }
  }, [generateDocumentNumber, projectGuid]);

  /**
   * Handles editor preparing for deliverable fields, including automatic document number generation
   * and field enabling/disabling based on deliverable type
   */
  const handleEditorPreparing = useCallback((e: any) => {
    const originalSetValue = e.editorOptions?.onValueChanged;
    const dataField = e.dataField;
    const editorOptions = e.editorOptions || {};
    const row = e.row;
    // Add document number generation to all relevant fields
    if (['deliverableTypeId', 'areaNumber', 'discipline', 'documentType'].includes(dataField)) {
      editorOptions.onValueChanged = async (args: any) => {
        // Call the original setValue function if it exists
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // Get current values, updating the changed field with args.value
        const deliverableTypeId = dataField === 'deliverableTypeId' ? args.value : row.data.deliverableTypeId;
        const areaNumber = dataField === 'areaNumber' ? args.value : row.data.areaNumber;
        const discipline = dataField === 'discipline' ? args.value : row.data.discipline;
        const documentType = dataField === 'documentType' ? args.value : row.data.documentType;
        
        // Use our helper method for document number updates
        updateDocumentNumber(
          row, 
          deliverableTypeId, 
          areaNumber, 
          discipline, 
          documentType
        );
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
                  
                  // Use context method for document number updates
                  updateDocumentNumber(
                    row, 
                    deliverableTypeId, 
                    areaNumber, 
                    discipline, 
                    documentType
                  );
                }
              } catch (error) {
                console.error('Error generating document number:', error);
              }
            }
          }
        }
      ];
    }
  }, [updateDocumentNumber]);
  
  return {
    handleGridInitialized,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    updateDocumentNumber
  };
};
