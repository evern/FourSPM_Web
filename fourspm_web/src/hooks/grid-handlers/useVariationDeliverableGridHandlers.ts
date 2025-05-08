import { useCallback, useRef, useEffect } from 'react';
import { useVariationDeliverables } from '@/contexts/variation-deliverables/variation-deliverables-context';
import { VariationDeliverableUiStatus } from '@/types/app-types';
import { 
  addExistingDeliverableToVariation,
  cancelDeliverableVariation,
  addNewDeliverableToVariation 
} from '@/adapters/variation-deliverable.adapter';
import { useVariationDeliverableGridValidator } from '@/hooks/grid-handlers/useVariationDeliverableGridValidator';
import { useGridUtils } from '../utils/useGridUtils';
import { useDeliverableGridEditor } from '../grid-editors/useDeliverableGridEditor';
import { ALWAYS_READONLY_DELIVERABLE_FIELDS } from '../grid-editors/useDeliverableGridEditor';
import { useAuth } from '@/contexts/auth';
import { Deliverable } from '@/types/odata-types';
import { confirm, alert } from 'devextreme/ui/dialog';

export const useVariationDeliverableGridHandlers = (props?: {
  projectGuid?: string;
  project?: any;
}) => {
  const variationDeliverables = useVariationDeliverables();
  const { user } = useAuth();
  
  // Clean approach: Use passed projectGuid or fall back to context
  const projectGuid = props?.projectGuid || variationDeliverables?.projectGuid;
  
  // We'll use the project object directly from the parent component instead of accessing through variation
  const project = props?.project;
  
  const gridUtils = useGridUtils();
  const { setCellValue, cancelEditData } = gridUtils;
  
  const requestInProgressRef = useRef<boolean>(false);
  
  const isFieldEditable = useCallback((fieldName: string, uiStatus?: string) => {
    if (ALWAYS_READONLY_DELIVERABLE_FIELDS.includes(fieldName)) {
      return false;
    }
    return true;
  }, []);
  
  const { 
    handleEditorPreparing: baseHandleEditorPreparing, 
    handleInitNewRow: baseHandleInitNewRow,
    updateDocumentNumber: baseUpdateDocumentNumber
  } = useDeliverableGridEditor({
    projectGuid: variationDeliverables.projectGuid || '',
    userToken: user?.token,
    isFieldEditable,
    setCellValue,
    isVariation: true  // Mark as variation to use XXX format for document numbers
  });
  
  const gridRef = useRef<any>(null);
  const dataGridRef = useRef<any>(null);
  
  const handleGridInitialized = useCallback((e: any) => {
    dataGridRef.current = e.component;
    gridRef.current = e.component;
    gridUtils.handleGridInitialized(e);
  }, [gridUtils]);
  
  const { handleRowValidating } = useVariationDeliverableGridValidator({
    onValidationError: (errorText) => {
      console.error('Validation error:', errorText);
    }
  });
  
  const handleRowUpdating = useCallback((e: any) => {
    e.cancel = true;
    
    const originalDeliverableGuid = e.originalDeliverableGuid;
    const newData = {...e.oldData, ...e.newData};
    
    const update = async () => {
      try {
        await updateDeliverable(newData, originalDeliverableGuid);
        
        setTimeout(() => {
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          e.component.getDataSource().reload();
        }, 50);
      } catch (error) {
        console.error('Error updating variation deliverable:', error);
        throw error;
      }
    };
    
    return update();
  }, []);
  
  const handleRowInserting = useCallback((e: any) => {
    e.cancel = true;
    
    const insert = async () => {
      try {
        await addDeliverable(e.data);
        
        setTimeout(() => {
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          e.component.getDataSource().reload();
        }, 50);
      } catch (error) {
        console.error('Error adding new deliverable:', error);
        throw error;
      }
    };
    
    return insert();
  }, []);
  
  const handleInitNewRow = useCallback((e: any) => {
    baseHandleInitNewRow(e);
    
    if (e && e.data) {
      // Set required UI status for new deliverable
      e.data.uiStatus = 'Add';
      
      // Initialize with empty values to ensure OData serialization requirements are met
      e.data.projectNumber = '';
      e.data.clientNumber = '';
      e.data.clientDocumentNumber = '';
      
      // Set client and project info if available
      if (project) {
        // Set project number if available
        if (project.projectNumber) {
          e.data.projectNumber = project.projectNumber;
        }
        
        // Set client number if available
          if (project.client?.number) {
          e.data.clientNumber = project.client.number;
        }
      }
    }
  }, [baseHandleInitNewRow, project]);
  
  const handleEditorPreparing = useCallback((e: any) => {
    // Call base handler first to set up standard behavior
    baseHandleEditorPreparing(e);
    
    const { dataField, editorOptions, row } = e;
    
    // Remove refresh button for document number field
    if (dataField === 'internalDocumentNumber' && editorOptions.buttons) {
      // Clear buttons array to remove the refresh button
      editorOptions.buttons = [];
    }
    
    if (row?.data) {
      const uiStatus = (row.data.uiStatus || 'Original') as VariationDeliverableUiStatus;
      
      // Special handling for Edit and Original status - only allow editing variationHours
      if (uiStatus === 'Edit' || uiStatus === 'Original') {
        // Only variationHours is editable in Edit or Original status
        editorOptions.disabled = (dataField !== 'variationHours');
      } else if (uiStatus === 'Cancel') {
        // For Cancel status, all field editings are disabled
        editorOptions.disabled = true;
      } else {
        // For other statuses (Add), use the default editability rules
        const isEditable = variationDeliverables.isFieldEditable(dataField, uiStatus);
        editorOptions.disabled = !isEditable;
      }
      
      if (uiStatus === 'Add' && ['areaNumber', 'discipline', 'documentType'].includes(dataField)) {
        const originalOnValueChanged = editorOptions.onValueChanged;
        
        editorOptions.onValueChanged = async (args: any) => {
          if (originalOnValueChanged) {
            await originalOnValueChanged(args);
          }
          
          if (variationDeliverables.variation?.guid) {
            row.data.variationGuid = variationDeliverables.variation.guid;
          }
        };
      }
    }
  }, [baseHandleEditorPreparing, variationDeliverables]);
  
  const handleCancellationClick = useCallback(async (e: any, isReadOnly?: boolean): Promise<void> => {
    // Check if variation is in read-only mode
    if (isReadOnly) {
      // Determine if the variation is approved or just submitted
      const status = variationDeliverables.variation?.clientApproved ? 'approved' : 'submitted';
      const title = `Variation ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      await alert(`This variation has been ${status} and cannot be modified.`, title);
      return;
    }
    
    const deliverableData = e.row ? e.row.data : e.data;
    const currentVariationGuid = variationDeliverables.variation?.guid;
    
    // Check if this deliverable belongs to a different variation than the current one
    if (deliverableData.variationGuid && 
        deliverableData.variationGuid !== currentVariationGuid && 
        deliverableData.variationStatus === 'ApprovedVariation') {
      
      // Extract variation name if available
      let variationName = 'another approved variation';
      if (deliverableData.variation && deliverableData.variation.name) {
        variationName = deliverableData.variation.name;
      } else if (deliverableData.variationName) {
        variationName = deliverableData.variationName;
      }
      
      // Display a friendly error message without a confirmation dialog
      await alert(`This deliverable belongs to ${variationName} and cannot be cancelled.

Please make changes to the original deliverable instead.`, 
                 'Approved Variation');
      return;
    }
    
    // Determine confirmation message based on the current status
    let message = '';
    if (deliverableData.uiStatus === 'Add') {
      message = 'Are you sure you want to remove this deliverable from the variation?';
    } else if (deliverableData.uiStatus === 'Edit') {
      message = 'Are you sure you want to discard your changes to this deliverable?';
    } else if (deliverableData.variationStatus === 'UnapprovedCancellation') {
      message = 'Are you sure you want to undo the cancellation of this deliverable?';
    } else {
      message = 'Are you sure you want to cancel this deliverable?';
    }
    
    const confirmed = await confirm(message, 'Confirm Cancellation');
    if (!confirmed) return;
    
    try {
      // Pass the actual deliverable data to cancelVariationDeliverable
      await cancelVariationDeliverable(deliverableData);
      
      setTimeout(() => {
        if (gridRef.current && gridRef.current.getDataSource()) {
          gridRef.current.getDataSource().reload();
        }
      }, 50);
    } catch (error) {
      console.error('Error cancelling deliverable:', error);
    }
  }, []);
  
  const updateDeliverable = useCallback(async (data: any, originalDeliverableGuid: string) => {
    if (requestInProgressRef.current) return;
    requestInProgressRef.current = true;
    
    try {
      const currentVariationGuid = variationDeliverables.variation?.guid;
      if (!currentVariationGuid || !user?.token) {
        throw new Error('Missing required parameters: variationId or authentication token');
      }
      
      // Check if this deliverable belongs to a different variation than the current one
      if (data.variationGuid && 
          data.variationGuid !== currentVariationGuid && 
          data.variationStatus === 'ApprovedVariation') {
        
        // Extract variation name if available
        let variationName = 'another approved variation';
        if (data.variation && data.variation.name) {
          variationName = data.variation.name;
        } else if (data.variationName) {
          variationName = data.variationName;
        }
        
        // Display a friendly error message without making the API call
        await alert(`This deliverable belongs to ${variationName} and cannot be modified.

Please make changes to the original deliverable instead.`, 
                   'Approved Variation');
        
        return false;
      }

      await addExistingDeliverableToVariation({
        ...data,
        guid: data.guid,
        originalDeliverableGuid: originalDeliverableGuid || data.guid,
        variationGuid: currentVariationGuid
      }, user.token);
      
      return true;
    } catch (error) {
      console.error('Error updating variation deliverable:', error);
      throw error;
    } finally {
      requestInProgressRef.current = false;
    }
  }, [variationDeliverables.variation?.guid, user?.token]);
  
  const addDeliverable = useCallback(async (data: any) => {
    if (requestInProgressRef.current) return;
    requestInProgressRef.current = true;
    
    try {
      const variationGuid = variationDeliverables.variation?.guid;
      const projGuid = projectGuid || variationDeliverables.projectGuid;
      if (!variationGuid || !user?.token || !projGuid) {
        throw new Error('Missing required parameters: variationId, projectGuid, or authentication token');
      }
      
      const defaultValues = variationDeliverables.getDefaultDeliverableValues();
      const newData = {
        ...defaultValues,
        ...data,
        projectGuid: projGuid,
        variationGuid: variationGuid,
        uiStatus: 'Add',
      } as Deliverable;
      
      await addNewDeliverableToVariation(newData, user.token);
      
      return true;
    } catch (error) {
      console.error('Error adding new deliverable:', error);
      throw error;
    } finally {
      requestInProgressRef.current = false;
    }
  }, [variationDeliverables.variation?.guid, projectGuid, variationDeliverables.projectGuid, user?.token, variationDeliverables.getDefaultDeliverableValues]);

  const cancelVariationDeliverable = useCallback(async (deliverable: Deliverable): Promise<boolean | undefined> => {
    if (requestInProgressRef.current) return;
    requestInProgressRef.current = true;
    
    try {
      const currentVariationGuid = variationDeliverables.variation?.guid;
      if (!currentVariationGuid || !user?.token) {
        throw new Error('Missing required parameters: variationId or authentication token');
      }

      // Note: We've moved the variation check to the onCancelDeliverable handler
      // so users see the message before any confirmation dialog appears
      
      // For Add status, we no longer need removeDeliverableFromVariation as that function was removed
      // For all other statuses, we use the new cancellation endpoint
      const originalGuid = deliverable.originalDeliverableGuid || deliverable.guid;
      
      // Call the updated adapter method with both required parameters
      const result = await cancelDeliverableVariation(
        originalGuid,
        currentVariationGuid,
        user.token
      );
      
      // Allow grid refresh to happen on success
      // The grid will get the updated entity with the proper status
      return true;
    } catch (error) {
      console.error('Error cancelling deliverable:', error);
      throw error;
    } finally {
      requestInProgressRef.current = false;
    }
  }, [variationDeliverables.variation?.guid, user?.token]);

  return {
    handleGridInitialized,
    handleRowValidating,
    handleRowInserting,
    handleRowUpdating, 
    handleInitNewRow,
    handleEditorPreparing,
    handleCancellationClick,
    dataGridRef,
    cancelEditData
  };
};
