import { compareGuids } from '../utils/guid-utils';
import { handleProgressUpdate } from '../services/progress.service';
import { updateDeliverableGate } from '../services/deliverable-gate.service';
import { DeliverableGate } from '../types/progress';

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
      const futurePeriodEarntPercentage = e.oldData.futurePeriodEarntPercentage || 1.0;
      
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
  
  // Handle row updating event to manage progress updates and gate changes
  const handleRowUpdating = (e: any) => {
    console.log('Row updating:', e);
    e.cancel = true; // Cancel default handling
    
    // Create a function to handle refreshing the grid after update
    const refreshGrid = () => {
      if (e.component) {
        e.component.refresh();
        e.component.cancelEditData();
      }
    };
    
    // Handle different types of updates based on changed properties
    const updatePromise = processRowUpdate(e);
    
    // Chain the promise to refresh the grid and handle errors
    return updatePromise
      .then(refreshGrid)
      .catch(error => {
        console.error('Error updating row:', error);
      });
  };
  
  // Process row updates based on what properties changed
  const processRowUpdate = (e: any) => {
    const { key, newData, oldData } = e;
    
    // Case 1: Updating both percentage and gate simultaneously
    if (newData.cumulativeEarntPercentage !== undefined && newData.deliverableGateGuid !== undefined) {
      console.log('Updating both percentage and gate');
      return handleCombinedUpdate(key, newData, oldData);
    }
    
    // Case 2: Updating percentage only
    if (newData.cumulativeEarntPercentage !== undefined) {
      console.log('Updating percentage only');
      return handleProgressUpdate(key, newData, currentPeriod, oldData);
    }
    
    // Case 3: Updating gate only, with possible auto percentage
    if (newData.deliverableGateGuid !== undefined) {
      return handleGateUpdate(key, newData, oldData);
    }
    
    // Case 4: Updating other fields (default handler)
    console.log('Using default update handler for', Object.keys(newData));
    return Promise.resolve();
  };
  
  // Handle combined updates to both percentage and gate
  const handleCombinedUpdate = (deliverableKey: string, newData: any, oldData: any) => {
    console.log('Handling combined gate and percentage update');
    
    // Find the selected gate
    const selectedGate = deliverableGates.find(gate => 
      compareGuids(gate.guid, newData.deliverableGateGuid)
    );
    
    if (!selectedGate) {
      console.warn('Selected gate not found');
      return Promise.reject('Selected gate not found');
    }
    
    // Use backend-provided value for previous period percentage
    const previousPeriodEarntPercentage = oldData.previousPeriodEarntPercentage || 0;
    
    // Get user's entered percentage and current percentage
    const userPercentage = newData.cumulativeEarntPercentage;
    
    // Determine which percentage to use
    let percentageToUse = userPercentage;
    
    // If gate has auto percentage and it's higher than user's percentage AND previous period percentage, use auto percentage
    if (selectedGate.autoPercentage !== null && 
        selectedGate.autoPercentage > userPercentage && 
        selectedGate.autoPercentage > previousPeriodEarntPercentage) {
      console.log(`Using gate auto percentage (${selectedGate.autoPercentage}) instead of user percentage (${userPercentage})`);
      percentageToUse = selectedGate.autoPercentage ?? undefined;
    } else {
      console.log(`Using user percentage (${userPercentage}) over gate auto percentage`);
    }
    
    // Update gate first, then the percentage
    return updateDeliverableGate(deliverableKey, newData.deliverableGateGuid, userToken || '')
      .then(() => {
        return handleProgressUpdate(
          deliverableKey, 
          { cumulativeEarntPercentage: percentageToUse }, 
          currentPeriod, 
          oldData
        );
      });
  };
  
  // Handle deliverable gate updates with possible auto percentage
  const handleGateUpdate = (deliverableKey: string, newData: any, oldData: any) => {
    console.log('Updating deliverable gate');
    
    // Find the selected gate
    const selectedGate = deliverableGates.find(gate => 
      compareGuids(gate.guid, newData.deliverableGateGuid)
    );
    
    if (!selectedGate) {
      console.warn('Selected gate not found');
      return Promise.reject('Selected gate not found');
    }
    
    // Use backend-provided value for previous period percentage
    const previousPeriodEarntPercentage = oldData.previousPeriodEarntPercentage || 0;
    
    // Check if we need to apply auto percentage
    if (selectedGate.autoPercentage !== null) {
      const currentPercentage = oldData.cumulativeEarntPercentage || 0;
      
      // Only apply auto percentage if it's higher than previous period percentage
      if (selectedGate.autoPercentage > previousPeriodEarntPercentage) {
        console.log(`Applying auto percentage: ${selectedGate.autoPercentage} (previous period: ${previousPeriodEarntPercentage})`);
        
        // Need to update both - first update the gate, then track progress
        return updateDeliverableGate(deliverableKey, newData.deliverableGateGuid, userToken || '')
          .then(() => {
            // Then update progress percentage
            return handleProgressUpdate(
              deliverableKey, 
              { cumulativeEarntPercentage: selectedGate.autoPercentage ?? undefined }, 
              currentPeriod, 
              oldData
            );
          });
      }
    }
    
    // Just update the gate without percentage change
    console.log('Updating gate only (no auto percentage or no increase needed)');
    return updateDeliverableGate(deliverableKey, newData.deliverableGateGuid, userToken || '');
  };
  
  return {
    handleRowValidating,
    handleRowUpdating
  };
};
