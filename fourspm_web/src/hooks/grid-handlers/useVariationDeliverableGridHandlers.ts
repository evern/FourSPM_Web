import { useCallback, useRef } from 'react';
import { useVariationDeliverables } from '../../contexts/variation-deliverables/variation-deliverables-context';
import { useDeliverables } from '../../contexts/deliverables/deliverables-context';
import { confirm, alert } from 'devextreme/ui/dialog';
import notify from 'devextreme/ui/notify';
import { VariationDeliverableUiStatus } from '../../contexts/variation-deliverables/variation-deliverables-types';

export const useVariationDeliverableGridHandlers = (props?: {
  projectGuid?: string;
  project?: any;
}) => {
  // Use both contexts for shared functionality
  const variationDeliverables = useVariationDeliverables();
  const deliverables = useDeliverables();
  
  // We'll use the project object directly from the parent component instead of accessing through variation
  const project = props?.project;
  
  // Single ref for grid component
  const gridRef = useRef<any>(null);
  
  /**
   * Handles the grid initialization event
   */
  const handleGridInitialized = useCallback((e: any) => {
    gridRef.current = e.component;
  }, []);
  
  /**
   * Enhanced row validation handler that uses context's validation function
   */
  const handleRowValidating = useCallback((e: any) => {
    if (!e.newData) return;
    
    // Get UI status to determine which fields should be validated
    const data = { ...e.oldData, ...e.newData };
    const uiStatus = data.uiStatus as VariationDeliverableUiStatus || 'Original';
    
    // For Original status, only validate variationHours if it was changed
    if (uiStatus === 'Original') {
      // Clear any other validation except for variationHours
      const keys = Object.keys(e.newData);
      if (keys.length === 1 && keys[0] === 'variationHours') {
        // Apply validation using context function
        const result = variationDeliverables.validateVariationDeliverable(data);
        if (!result.isValid) {
          e.isValid = false;
          // Format the error messages for display
          e.errorText = Object.values(result.errors).flat().join('\n');
        }
      } else {
        // Skip validation for fields that shouldn't be editable
        e.isValid = true;
      }
      return;
    }
    
    // For other statuses, use the context validator
    const result = variationDeliverables.validateVariationDeliverable(data);
    if (!result.isValid) {
      e.isValid = false;
      // Format the error messages for display
      e.errorText = Object.values(result.errors).flat().join('\n');
    }
  }, [variationDeliverables]);
  
  const handleRowUpdating = useCallback((e: any) => {
    e.cancel = true;
    const newData = {...e.oldData, ...e.newData};
    
    // Check if this is a modification to variation hours specifically
    const isVariationHoursChange = Object.keys(e.newData).length === 1 && 
                                Object.keys(e.newData)[0] === 'variationHours';
    
    const update = async () => {
      try {
        // Check if this deliverable is from a different variation by comparing variation names
        const isFromDifferentVariation = newData.variationName && 
                                      variationDeliverables.variation?.name && 
                                      newData.variationName !== variationDeliverables.variation.name;
        
        // If this is a variation hours change on a deliverable from another variation,
        // calculate the difference and update only the delta
        if (isFromDifferentVariation && isVariationHoursChange) {
          const originalHours = e.oldData.variationHours || 0;
          const newHours = e.newData.variationHours || 0;
          const hoursDifference = newHours - originalHours;
          
          // Use the hours difference (which can be negative)
          newData.variationHours = hoursDifference;
        }
        
        // Use the context's enhanced update function
        // Set skipStateUpdate=true to prevent triggering state updates
        const result = await variationDeliverables.updateVariationDeliverable(newData, true);
        
        // Show notification if a deliverable from another variation was updated
        if (isFromDifferentVariation) {
          // Get the current variation name
          const currentVariationName = variationDeliverables.variation?.name || 'current variation';
          
          // Show toast notification about the copy created with hours information
          const hoursDifference = isVariationHoursChange ? 
                               (e.newData.variationHours - e.oldData.variationHours) : null;
          
          let message = `A copy of this deliverable has been created for ${currentVariationName}`;
          if (isVariationHoursChange && hoursDifference) {
            message += ` with ${hoursDifference} variation hours`;
          }
          
          notify({
            message,
            type: 'success',
            displayTime: 4000,
            position: {
              at: 'top center',
              my: 'top center',
              offset: '0 10'
            }
          });
        }
        
        // If the update was not allowed by business rules (e.g., approved status)
        if (result === false) {
          // Extract variation name if available
          let variationName = 'an approved variation';
          if (newData.variation && newData.variation.name) {
            variationName = newData.variation.name;
          } else if (newData.variationName) {
            variationName = newData.variationName;
          }
          
          // Only show error for non-variation-hours changes
          if (!isVariationHoursChange) {
            await alert(`Only variation hours can be modified for deliverables from ${variationName}.`, 'Limited Modification');
            return false;
          }
        }
        
        // Refresh the grid after successful update
        setTimeout(() => {
          // Cancel any pending edits
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          
          // Use the stored grid reference which is more stable than e.component
          if (gridRef.current) {
            gridRef.current.refresh();
          }
        }, 50);
        
        return true;
      } catch (error) {
        console.error('Error updating variation deliverable:', error);
        throw error;
      }
    };
    
    return update();
  }, [variationDeliverables]);
  
  const handleRowInserting = useCallback((e: any) => {
    e.cancel = true;
    
    const insert = async () => {
      try {
        // Use the context's enhanced function with skipStateUpdate=true to prevent re-renders
        await variationDeliverables.addNewVariationDeliverable(e.data, true);
        
        // Refresh the grid after successful insertion
        setTimeout(() => {
          // Cancel any pending edits
          if (e.component.hasEditData()) {
            e.component.cancelEditData();
          }
          
          // Use the stored grid reference which is more stable than e.component
          if (gridRef.current) {
            gridRef.current.refresh();
          }
        }, 50);
        
        return true;
      } catch (error) {
        console.error('Error adding new deliverable:', error);
        throw error;
      }
    };
    
    return insert();
  }, [variationDeliverables]);
  
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Get default values from the variation deliverables context
      const defaultValues = variationDeliverables.getDefaultDeliverableValues();
      Object.assign(e.data, defaultValues);
      
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
  }, [variationDeliverables, project]);
  
  const handleEditorPreparing = useCallback((e: any) => {
    const originalSetValue = e.editorOptions?.onValueChanged;
    const { dataField, editorOptions, row } = e;
    
    // Add automatic document number generation for Add status only
    if (row?.data?.uiStatus === 'Add' && 
        ['deliverableTypeId', 'areaNumber', 'discipline', 'documentType'].includes(dataField)) {
      
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
        
        // Attempt to generate document number when all required fields are available
        if (deliverableTypeId && areaNumber && discipline && documentType) {
          try {
            const suggestedNumber = await deliverables.generateDocumentNumber(
              deliverableTypeId,
              areaNumber,
              discipline,
              documentType,
              row.data?.guid,
              true // This is a variation deliverable
            );
            
            if (suggestedNumber) {
              // Update the row data and grid
              row.data.internalDocumentNumber = suggestedNumber;
              gridRef.current?.cellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
            }
          } catch (error) {
            console.error('Error generating document number:', error);
          }
        }
        
        // Set variation GUID if available
        if (variationDeliverables.variation?.guid) {
          row.data.variationGuid = variationDeliverables.variation.guid;
        }
      };
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
        // For other statuses (Add), use the context's isFieldEditable function
        const isEditable = variationDeliverables.isFieldEditable(row.data, dataField);
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
  }, [variationDeliverables, deliverables]);
  
  // Removed cancelVariationDeliverable function - now using the context's function directly

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
    
    // Check if this deliverable is from a different variation by comparing variation names
    const isFromDifferentVariation = deliverableData.variationName && 
                                  variationDeliverables.variation?.name && 
                                  deliverableData.variationName !== variationDeliverables.variation.name;
    
    if (isFromDifferentVariation) {
      await alert(`Deliverables from other variations cannot be cancelled. To modify this deliverable, please edit the variation hours instead.`, 
                'Cannot Cancel');
      return;
    }
    
    // Use the context's business logic to determine if the deliverable can be cancelled
    const { canCancel, reason } = variationDeliverables.canDeliverableBeCancelled(deliverableData);
    
    // If it can't be cancelled, show the reason and return
    if (!canCancel) {
      await alert(reason || 'This deliverable cannot be cancelled.', 'Cannot Cancel');
      return;
    }
    
    // If a confirmation is needed, show the dialog with the reason message
    const confirmed = await confirm(reason || 'Are you sure you want to cancel this deliverable?', 'Confirm Cancellation');
    if (!confirmed) return;
    
    try {
      // Use the context's method to cancel the deliverable directly with GUID
      // Pass skipStateUpdate=true to prevent UI flickering while still updating the database
      await variationDeliverables.cancelDeliverable(deliverableData.originalDeliverableGuid || deliverableData.guid, true);
      
      // Refresh the grid after successful cancellation
      setTimeout(() => {
        // Use the stored grid reference which is more stable
        if (gridRef.current) {
          gridRef.current.refresh();
        }
      }, 50);
    } catch (error) {
      console.error('Error cancelling deliverable:', error);
    }
  }, [variationDeliverables]);
  
  // Removed updateDeliverable function - now using the context's updateVariationDeliverable function
  
  // Removed addDeliverable function - its logic has been moved to the context

  // Removed unused validateField function

  return {
    handleGridInitialized,
    handleRowValidating,
    handleRowInserting,
    handleRowUpdating, 
    handleInitNewRow,
    handleEditorPreparing,
    handleCancellationClick
  };
};
