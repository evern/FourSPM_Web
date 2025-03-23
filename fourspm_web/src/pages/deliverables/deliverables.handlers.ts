import { v4 as uuidv4 } from 'uuid';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { API_CONFIG } from '../../config/api';

interface UseDeliverablesHandlersProps {
  projectId: string;
  endpoint: string;
  userToken?: string;
  gridInstance: any;
  setGridInstance: (instance: any) => void;
}

export const useDeliverablesHandlers = ({
  projectId,
  endpoint,
  userToken,
  gridInstance,
  setGridInstance
}: UseDeliverablesHandlersProps) => {
  // Grid operations for CRUD actions
  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete deliverable:', error),
    onUpdateError: (error) => console.error('Failed to update deliverable:', error)
  });

  // Validation rules for deliverables
  const handleRowValidating = useGridValidation([
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
    { field: 'departmentId', required: true, errorText: 'Department is required' },
    { field: 'deliverableTypeId', required: true, errorText: 'Deliverable Type is required' },
    { field: 'documentTitle', required: true, maxLength: 200, errorText: 'Document Title is required' }
  ]);

  // Function to fetch a suggested internal document number from the server
  const fetchSuggestedDocumentNumber = async (
    deliverableTypeId: string, 
    areaNumber: string, 
    discipline: string, 
    documentType: string
  ) => {
    if (!userToken || !projectId || !gridInstance) return;
    
    try {
      // Only proceed if we have the minimum required fields
      // For "Deliverable" type, we need the area number
      if (deliverableTypeId === 'Deliverable' && !areaNumber) {
        return;
      }
      
      // Build the URL with query parameters
      const url = `${API_CONFIG.baseUrl}/odata/v1/Deliverables/SuggestInternalDocumentNumber?projectGuid=${projectId}&deliverableTypeId=${deliverableTypeId}&areaNumber=${areaNumber}&discipline=${discipline}&documentType=${documentType}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.suggestedNumber;
      } else {
        console.error('Failed to fetch suggested document number:', await response.text());
        return '';
      }
    } catch (error) {
      console.error('Error suggesting document number:', error);
      return '';
    }
  };

  // Initialize new row with default values
  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectGuid: projectId,
      clientNumber: '',  
      projectNumber: '', 
      areaNumber: '',
      discipline: '',
      documentType: '',
      departmentId: 'Administration',
      deliverableTypeId: 'Task',
      internalDocumentNumber: '',
      clientDocumentNumber: '',
      documentTitle: '',
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,    
      totalCost: 0,
      bookingCode: ''
    };
  };
  
  // Handle field changes and update document numbering accordingly
  const handleEditorPreparing = (e: any) => {
    const { dataField, row, editorOptions } = e;
    
    if (!row) return;
    
    // Setup field change watchers for fields that affect document numbering
    if (['areaNumber', 'discipline', 'documentType', 'deliverableTypeId'].includes(dataField)) {
      const originalValueChanged = editorOptions.onValueChanged;
      
      editorOptions.onValueChanged = async (args: any) => {
        // Call the original handler first
        if (originalValueChanged) {
          originalValueChanged(args);
        }
        
        // Get current values from the row data
        const rowData = row.data;
        const deliverableTypeId = dataField === 'deliverableTypeId' ? args.value : rowData.deliverableTypeId;
        const areaNumber = dataField === 'areaNumber' ? args.value : rowData.areaNumber;
        const discipline = dataField === 'discipline' ? args.value : rowData.discipline;
        const documentType = dataField === 'documentType' ? args.value : rowData.documentType;
        
        // Only attempt to generate a document number if we have enough required fields
        const shouldGenerateNumber = 
          deliverableTypeId && 
          ((deliverableTypeId === 'Deliverable' && areaNumber) || deliverableTypeId !== 'Deliverable') &&
          (discipline || documentType)
        ;
        
        if (shouldGenerateNumber) {
          const suggestedNumber = await fetchSuggestedDocumentNumber(deliverableTypeId, areaNumber, discipline, documentType);
          
          if (suggestedNumber && gridInstance) {
            // Find the cell for internal document number and update it
            gridInstance.cellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
          }
        }
      };
    }
  };
  
  // Save grid instance for later use
  const handleGridInitialized = (e: any) => {
    setGridInstance(e.component);
  };

  return {
    handleRowUpdating,
    handleRowRemoving,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    handleGridInitialized
  };
};
