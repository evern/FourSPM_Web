import { useCallback } from 'react';
import { getSuggestedDocumentNumber } from '../../adapters/deliverable.adapter';

export interface UseDeliverableDocumentNumberProps<TStatus = string> {
  projectGuid: string;
  userToken?: string;
  isFieldEditable: (fieldName: string, uiStatus: TStatus) => boolean;
  setCellValue: (rowIndex: number, dataField: string, value: any) => void;
  onError?: (error: any) => void;
}

/**
 * Hook for handling document number generation and editor preparing for deliverable fields
 */
export const useDeliverableDocumentNumber = <TStatus = string>({
  projectGuid,
  userToken,
  isFieldEditable,
  setCellValue,
  onError
}: UseDeliverableDocumentNumberProps<TStatus>) => {
  
  /**
   * Fetches a suggested document number based on deliverable details
   */
  const fetchSuggestedDocumentNumber = useCallback(async (
    deliverableTypeId: string,
    areaNumber: string, 
    discipline: string, 
    documentType: string,
    currentDeliverableGuid?: string
  ): Promise<string> => {
    try {
      if (!projectGuid) {
        return '';
      }
      
      const suggestedNumber = await getSuggestedDocumentNumber(
        projectGuid,
        deliverableTypeId,
        areaNumber, 
        discipline, 
        documentType,
        userToken || '',
        currentDeliverableGuid 
      );
      
      return suggestedNumber || '';
    } catch (error) {
      return '';
    }
  }, [projectGuid, userToken]);

  /**
   * Handles editor preparing for deliverable fields, including automatic document number generation
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
    
    if (['areaNumber', 'discipline', 'documentType', 'deliverableTypeId'].includes(dataField)) {
      editorOptions.onValueChanged = async (args: any) => {
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        const rowData = row.data;
        const deliverableTypeId = dataField === 'deliverableTypeId' ? args.value : rowData.deliverableTypeId;
        const areaNumber = dataField === 'areaNumber' ? args.value : rowData.areaNumber;
        const discipline = dataField === 'discipline' ? args.value : rowData.discipline;
        const documentType = dataField === 'documentType' ? args.value : rowData.documentType;
        
        const shouldGenerateNumber = 
          deliverableTypeId !== undefined && 
          ((deliverableTypeId === '3' && areaNumber) || deliverableTypeId !== '3') &&
          (discipline || documentType)
        ;
        
        if (shouldGenerateNumber) {
          const suggestedNumber = await fetchSuggestedDocumentNumber(
            deliverableTypeId, 
            areaNumber, 
            discipline, 
            documentType,
            rowData.guid 
          );
          
          if (suggestedNumber) {
            try {
              row.data.internalDocumentNumber = suggestedNumber;
              setCellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
            } catch (error) {
              if (onError) onError(error);
            }
          }
        }
      };
    }
  }, [isFieldEditable, fetchSuggestedDocumentNumber, setCellValue, onError]);

  return {
    fetchSuggestedDocumentNumber,
    handleEditorPreparing
  };
};
