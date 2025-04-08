import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth';
import { getSuggestedDocumentNumber } from '@/adapters/deliverable.adapter';
import { v4 as uuidv4 } from 'uuid';
import { Deliverable } from '@/types/odata-types';
import { 
  DeliverableEditorContextProps,
  DeliverableEditorState,
  DeliverableEditorProviderProps,
  DocumentNumberParams
} from './deliverable-editor-types';
import { 
  deliverableEditorReducer, 
  initialDeliverableEditorState 
} from './deliverable-editor-reducer';

// Create deliverable editor context
const DeliverableEditorContext = createContext<DeliverableEditorContextProps | undefined>(undefined);

/**
 * Provider component for the deliverable editor context
 * Handles editor-specific behaviors like field interactions, document number generation,
 * and form initialization for deliverables
 */
export function DeliverableEditorProvider({ children }: DeliverableEditorProviderProps): React.ReactElement {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(deliverableEditorReducer, initialDeliverableEditorState);
  const { user } = useAuth();

  // Refs to track operations in progress - prevents unwanted re-renders
  const documentNumberGenerationInProgress = useRef(false);
  const documentNumberTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set loading state for document number generation
  const setGeneratingDocumentNumber = useCallback((isGenerating: boolean) => {
    dispatch({ type: 'SET_GENERATING_DOCUMENT_NUMBER', payload: isGenerating });
  }, []);
  
  // Set error state
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  // Get default values for a new deliverable
  const getDefaultDeliverableValues = useCallback((projectId?: string): Partial<Deliverable> => {
    return {
      guid: uuidv4(),
      projectGuid: projectId || '',
      departmentId: 'Design',
      deliverableTypeId: 'Deliverable',
      documentType: '',
      clientDocumentNumber: '',
      discipline: '',
      areaNumber: '',
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,
      totalCost: 0
    };
  }, []);
  
  // Fetch suggested document number for deliverables
  const fetchSuggestedDeliverableDocumentNumber = useCallback(async (
    params: DocumentNumberParams
  ): Promise<string> => {
    const { deliverableTypeId, areaNumber, discipline, documentType, guid, projectId } = params;
    
    // If already in progress, don't start another request
    if (documentNumberGenerationInProgress.current) {
      return '';
    }
    
    try {
      documentNumberGenerationInProgress.current = true;
      setGeneratingDocumentNumber(true);
      
      if (!projectId) {
        return '';
      }
      
      // Convert to string for consistency with API call
      const deliverableTypeIdStr = deliverableTypeId?.toString() || '';
      
      const suggestedNumber = await getSuggestedDocumentNumber(
        projectId,
        deliverableTypeIdStr,
        areaNumber, 
        discipline, 
        documentType,
        user?.token || '',
        guid
      );
      
      return suggestedNumber || '';
    } catch (error: unknown) {
      console.error('Error fetching suggested deliverable document number:', error);
      setError(error instanceof Error ? error.message : 'Error fetching document number');
      return '';
    } finally {
      // Use small timeout to prevent rapid consecutive calls
      setTimeout(() => {
        documentNumberGenerationInProgress.current = false;
        setGeneratingDocumentNumber(false);
      }, 300);
    }
  }, [user?.token, setGeneratingDocumentNumber, setError]); // Minimal dependencies
  
  // Update document number helper for deliverables
  const updateDeliverableDocumentNumber = useCallback(async (
    params: DocumentNumberParams & { row: any }
  ): Promise<void> => {
    const { row, deliverableTypeId, areaNumber, discipline, documentType, projectId } = params;
    // Prevent multiple concurrent calls and clear any pending timeouts
    if (documentNumberTimeoutRef.current) {
      clearTimeout(documentNumberTimeoutRef.current);
    }
    
    // Check if we have sufficient data to generate a number
    const isDeliverableType = 
      deliverableTypeId === 'Deliverable' || 
      deliverableTypeId === 3 || 
      deliverableTypeId === '3';
    
    const shouldGenerateNumber = 
      deliverableTypeId !== undefined && 
      ((isDeliverableType && areaNumber) || !isDeliverableType) &&
      (discipline || documentType);
    
    if (shouldGenerateNumber && row.data) {
      // Delay the document number generation to prevent editor from closing
      // This is crucial to avoid re-renders during editor initialization
      documentNumberTimeoutRef.current = setTimeout(async () => {
        const projectGuid = row.data.projectGuid;
        
        const suggestedNumber = await fetchSuggestedDeliverableDocumentNumber({
          deliverableTypeId, 
          areaNumber, 
          discipline, 
          documentType,
          guid: row.data?.guid,
          projectId: projectGuid
        });
        
        if (suggestedNumber) {
          try {
            // Update the row data directly
            row.data.internalDocumentNumber = suggestedNumber;
            
            // If there's an editor element, update it directly
            const editor = row.component?.getEditor('internalDocumentNumber');
            if (editor) {
              try {
                editor.option('value', suggestedNumber);
              } catch (err) {
                console.warn('Could not update editor directly:', err);
              }
            }
          } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'Error updating document number');
          }
        }
        
        documentNumberTimeoutRef.current = null;
      }, 500); // Sufficient delay to let DevExtreme initialize the editor
    }
  }, [fetchSuggestedDeliverableDocumentNumber, setError]);
  
  // Handle deliverable editor preparing
  const handleDeliverableEditorPreparing = useCallback((e: any) => {
    // Skip if this is a popup editor closing to prevent interference
    if (e.parentType === 'dataRow' && e.editorType === undefined) {
      return;
    }
    
    const originalSetValue = e.editorOptions?.onValueChanged;
    const dataField = e.dataField;
    const editorOptions = e.editorOptions || {};
    const row = e.row;
    
    // Special handling for the deliverableTypeId field
    if (dataField === 'deliverableTypeId') {
      // Override onValueChanged to update other fields when deliverable type changes
      editorOptions.onValueChanged = (args: any) => {
        // Call the original setValue function if it exists
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // Also trigger document number generation logic
        updateDeliverableDocumentNumber({
          row, 
          deliverableTypeId: args.value, 
          areaNumber: row.data.areaNumber, 
          discipline: row.data.discipline, 
          documentType: row.data.documentType,
          projectId: row.data.projectGuid
        });
      };
    }
    
    // Add document number generation to relevant deliverable fields
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
        
        updateDeliverableDocumentNumber({
          row, 
          deliverableTypeId, 
          areaNumber, 
          discipline, 
          documentType,
          projectId: row.data.projectGuid
        });
      };
    }
    
    // Special handling for the deliverable document number field - add a suggest button
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
                  
                  updateDeliverableDocumentNumber({
                    row, 
                    deliverableTypeId, 
                    areaNumber, 
                    discipline, 
                    documentType,
                    projectId: row.data.projectGuid
                  });
                }
              } catch (error: unknown) {
                console.error('Error generating deliverable document number:', error);
                setError(error instanceof Error ? error.message : 'Error generating document number');
              }
            }
          }
        }
      ];
    }
  }, [updateDeliverableDocumentNumber, setError]);
  
  // Handle new deliverable row initialization
  const handleDeliverableInitNewRow = useCallback((e: any) => {
    if (e?.data) {
      // Apply default deliverable values
      const defaults = getDefaultDeliverableValues(e.data.projectGuid);
      Object.assign(e.data, defaults);
    }
  }, [getDefaultDeliverableValues]);
  
  // Create memoized context value to prevent unnecessary re-renders
  // Following the pattern from memory for optimizing context providers
  const contextValue = useMemo(() => ({
    state,
    handleDeliverableEditorPreparing,
    handleDeliverableInitNewRow,
    fetchSuggestedDeliverableDocumentNumber,
    updateDeliverableDocumentNumber,
    getDefaultDeliverableValues
  }), [
    state, 
    handleDeliverableEditorPreparing, 
    handleDeliverableInitNewRow, 
    fetchSuggestedDeliverableDocumentNumber,
    updateDeliverableDocumentNumber,
    getDefaultDeliverableValues
  ]);
  
  return (
    <DeliverableEditorContext.Provider value={contextValue}>
      {children}
    </DeliverableEditorContext.Provider>
  );
}

/**
 * Custom hook to use the deliverable editor context
 * @returns The deliverable editor context value
 * @throws Error if used outside a DeliverableEditorProvider
 */
export function useDeliverableEditor(): DeliverableEditorContextProps {
  const context = useContext(DeliverableEditorContext);
  
  if (!context) {
    throw new Error('useDeliverableEditor must be used within a DeliverableEditorProvider');
  }
  
  return context;
}
