import { compareGuids } from '../../utils/guid-utils';
import { handleProgressUpdate } from '../../services/progress.service';
import { updateDeliverableGate } from '../../services/deliverable-gate.service';
import { DeliverableGate } from '../../types/progress';

export const useProgressHandlers = (
  deliverableGates: DeliverableGate[],
  currentPeriod: number,
  userToken: string | undefined
) => {
  // Handle row validation
  const handleRowValidating = (e: any) => {
    if (e.newData.cumulativeEarntPercentage !== undefined) {
      // Get the new percentage value
      const newPercentage = e.newData.cumulativeEarntPercentage;
      
      // Get the current gate - check newData first in case the gate is being changed
      const gateGuid = e.newData.deliverableGateGuid !== undefined ? e.newData.deliverableGateGuid : e.oldData.deliverableGateGuid;
      const currentGate = deliverableGates.find(gate => 
        compareGuids(gate.guid, gateGuid)
      );
      
      // Validate against gate max percentage
      if (currentGate && newPercentage > currentGate.maxPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot exceed gate maximum of ${(currentGate.maxPercentage * 100).toFixed(0)}%`;
        return;
      }
      
      // Use backend-provided values for previous and future period percentages
      const previousPeriodEarntPercentage = e.oldData.previousPeriodEarntPercentage || 0;
      const futurePeriodEarntPercentage = e.oldData.futurePeriodEarntPercentage || 0;
      
      // Validate that percentage doesn't decrease below previous period percentage
      if (newPercentage < previousPeriodEarntPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot be less than what's already reported in previous periods (${(previousPeriodEarntPercentage * 100).toFixed(0)}%)`;
        return;
      }
      
      // Validate that percentage doesn't exceed future period percentage
      if (newPercentage + futurePeriodEarntPercentage > 1.0) {
        e.isValid = false;
        e.errorText = `Combined percentage with future periods cannot exceed 100% (current: ${(newPercentage * 100).toFixed(0)}%, future: ${(futurePeriodEarntPercentage * 100).toFixed(0)}%)`;
        return;
      }
    }
  };
  
  // Handle row updating event for individual row edits
  const handleRowUpdating = (e: any) => {
    // In cell mode, we need to manually cancel and handle the update because we're using a function endpoint
    e.cancel = true;
    
    // Create a modified update function that handles the API call and grid refresh
    const update = async () => {
      try {
        // Process the update using our custom service
        await processRowUpdate(e);
        
        // Mark the grid as needing refresh after this edit
        if (e.component) {
          // Force the grid to refresh data from server
          setTimeout(() => {
            // This is important - first end edit mode, then reload data
            if (e.component.hasEditData()) {
              e.component.cancelEditData();
            }
            e.component.getDataSource().reload();
          }, 50);
        }
        
        return true;
      } catch (error) {
        console.error('Error updating row:', error);
        
        // Refresh grid on error too
        if (e.component) {
          e.component.refresh();
        }
        
        return false;
      }
    };
    
    // Start the update process
    update();
  };
  
  // Handle saving event (not used in cell mode, but keeping for backward compatibility)
  const handleSaving = (e: any) => {
    // In cell mode, saving is handled at the row level in handleRowUpdating
    // This function is kept for backward compatibility
  };
  
  // Process a single row update
  const processRowUpdate = async (e: any) => {
    try {
      // First, check if gate update is needed
      let gateUpdateNeeded = (
        e.newData.deliverableGateGuid !== undefined &&
        e.oldData.deliverableGateGuid !== e.newData.deliverableGateGuid
      );
      
      // If gate update is needed, do that first
      if (gateUpdateNeeded) {
        // Update the deliverable gate in the backend
        await updateDeliverableGate(e.key, e.newData.deliverableGateGuid, userToken || '');
      }
      
      // Next, check if progress update is needed
      if (e.newData.cumulativeEarntPercentage !== undefined) {
        // Call the progress service to update the backend
        await handleProgressUpdate(
          e.key,
          e.newData,
          currentPeriod,
          e.oldData
        );
      }
    } catch (error) {
      // Handle any errors that occur during updating
    }
  };
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleSaving
  };
};
