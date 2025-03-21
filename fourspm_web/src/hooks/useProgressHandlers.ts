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
    if (e.newData.totalPercentageEarnt !== undefined) {
      // Get the old percentage value
      const oldPercentage = e.oldData.totalPercentageEarnt || 0;
      const newPercentage = e.newData.totalPercentageEarnt;
      
      // Get the current gate
      const currentGate = deliverableGates.find(gate => 
        compareGuids(gate.guid, e.oldData.deliverableGateGuid)
      );
      
      // Validate against gate max percentage
      if (currentGate && newPercentage > currentGate.maxPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot exceed gate maximum of ${(currentGate.maxPercentage * 100).toFixed(0)}%`;
        return;
      }
      
      // Calculate previous period earned percentage
      // - This is derived from progressItems for periods less than currentPeriod
      let previousPeriodEarnedPercentage = 0;
      if (e.oldData.progressItems && Array.isArray(e.oldData.progressItems)) {
        const previousPeriodItems = e.oldData.progressItems.filter(
          (item: any) => item.period < currentPeriod && !item.deleted
        );
        
        if (previousPeriodItems.length > 0) {
          // Get the most recent previous period
          const maxPreviousPeriod = Math.max(...previousPeriodItems.map((item: any) => item.period));
          const previousPeriodItem = previousPeriodItems.find((item: any) => item.period === maxPreviousPeriod);
          
          if (previousPeriodItem && e.oldData.totalHours) {
            previousPeriodEarnedPercentage = previousPeriodItem.units / e.oldData.totalHours;
          }
        }
      }
      
      // Calculate future period earned percentage
      // - This is derived from progressItems for periods greater than currentPeriod
      let futurePeriodEarnedPercentage = 1.0; // Default to 100% if no future periods
      if (e.oldData.progressItems && Array.isArray(e.oldData.progressItems)) {
        const futurePeriodItems = e.oldData.progressItems.filter(
          (item: any) => item.period > currentPeriod && !item.deleted
        );
        
        if (futurePeriodItems.length > 0) {
          // Get the earliest future period
          const minFuturePeriod = Math.min(...futurePeriodItems.map((item: any) => item.period));
          const futurePeriodItem = futurePeriodItems.find((item: any) => item.period === minFuturePeriod);
          
          if (futurePeriodItem && e.oldData.totalHours) {
            futurePeriodEarnedPercentage = futurePeriodItem.units / e.oldData.totalHours;
          }
        }
      }
      
      // Validate that percentage doesn't decrease below previous period percentage
      if (newPercentage < previousPeriodEarnedPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot be less than what's already reported in previous periods (${(previousPeriodEarnedPercentage * 100).toFixed(0)}%)`;
        return;
      }
      
      // Validate that percentage doesn't exceed future period percentage
      if (newPercentage > futurePeriodEarnedPercentage) {
        e.isValid = false;
        e.errorText = `Percentage cannot exceed what's already reported in future periods (${(futurePeriodEarnedPercentage * 100).toFixed(0)}%)`;
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
    if (newData.totalPercentageEarnt !== undefined && newData.deliverableGateGuid !== undefined) {
      console.log('Updating both percentage and gate');
      return handleCombinedUpdate(key, newData, oldData);
    }
    
    // Case 2: Updating percentage only
    if (newData.totalPercentageEarnt !== undefined) {
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
    
    // Calculate previous period earned percentage (same logic as in validation)
    let previousPeriodEarnedPercentage = 0;
    if (oldData.progressItems && Array.isArray(oldData.progressItems)) {
      const previousPeriodItems = oldData.progressItems.filter(
        (item: any) => item.period < currentPeriod && !item.deleted
      );
      
      if (previousPeriodItems.length > 0) {
        // Get the most recent previous period
        const maxPreviousPeriod = Math.max(...previousPeriodItems.map((item: any) => item.period));
        const previousPeriodItem = previousPeriodItems.find((item: any) => item.period === maxPreviousPeriod);
        
        if (previousPeriodItem && oldData.totalHours) {
          previousPeriodEarnedPercentage = previousPeriodItem.units / oldData.totalHours;
        }
      }
    }
    
    // Get user's entered percentage and current percentage
    const userPercentage = newData.totalPercentageEarnt;
    
    // Determine which percentage to use
    let percentageToUse = userPercentage;
    
    // If gate has auto percentage and it's higher than user's percentage AND previous period percentage, use auto percentage
    if (selectedGate.autoPercentage !== null && 
        selectedGate.autoPercentage > userPercentage && 
        selectedGate.autoPercentage > previousPeriodEarnedPercentage) {
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
          { totalPercentageEarnt: percentageToUse }, 
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
    
    // Calculate previous period earned percentage (same logic as in validation)
    let previousPeriodEarnedPercentage = 0;
    if (oldData.progressItems && Array.isArray(oldData.progressItems)) {
      const previousPeriodItems = oldData.progressItems.filter(
        (item: any) => item.period < currentPeriod && !item.deleted
      );
      
      if (previousPeriodItems.length > 0) {
        // Get the most recent previous period
        const maxPreviousPeriod = Math.max(...previousPeriodItems.map((item: any) => item.period));
        const previousPeriodItem = previousPeriodItems.find((item: any) => item.period === maxPreviousPeriod);
        
        if (previousPeriodItem && oldData.totalHours) {
          previousPeriodEarnedPercentage = previousPeriodItem.units / oldData.totalHours;
        }
      }
    }
    
    // Check if we need to apply auto percentage
    if (selectedGate.autoPercentage !== null) {
      const currentPercentage = oldData.totalPercentageEarnt || 0;
      
      // Only apply auto percentage if it's higher than previous period percentage
      if (selectedGate.autoPercentage > previousPeriodEarnedPercentage) {
        console.log(`Applying auto percentage: ${selectedGate.autoPercentage} (previous period: ${previousPeriodEarnedPercentage})`);
        
        // Need to update both - first update the gate, then track progress
        return updateDeliverableGate(deliverableKey, newData.deliverableGateGuid, userToken || '')
          .then(() => {
            // Then update progress percentage
            return handleProgressUpdate(
              deliverableKey, 
              { totalPercentageEarnt: selectedGate.autoPercentage ?? undefined }, 
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
