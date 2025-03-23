import { compareGuids } from '../utils/guid-utils';
import { handleProgressUpdate } from '../services/progress.service';
import { updateDeliverableGate } from '../services/deliverable-gate.service';
import { DeliverableGate } from '../types/progress';
import { extractRowValue } from '../utils/grid-utils';

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
    // In batch mode, we don't cancel default behavior here
    // This will collect changes for batch processing
    
    // However, we still validate the data
    // The actual updates are processed in handleSaving
  };
  
  // Handle saving event for batch mode
  const handleSaving = (e: any) => {
    if (!e.changes || !e.changes.length) {
      return;
    }
    
    // Cancel default save behavior to handle it manually
    e.cancel = true;
    
    // Process each change sequentially
    const processChanges = async () => {
      for (const change of e.changes) {
        // For batch mode, we only care about update changes
        if (change.type !== 'update') {
          continue;
        }
        
        try {
          // Get values directly from the grid using the store method that we know works
          let totalHours = 0; // Default fallback
          let previousPeriodEarntPercentage = 0; // Default fallback
          
          try {
            // Get the full row data from the store
            const dataSource = e.component.getDataSource();
            const rowData = await dataSource.store().byKey(change.key);
            
            // Extract the values using our utility function
            totalHours = extractRowValue(rowData, 'totalHours', 0);
            previousPeriodEarntPercentage = extractRowValue(rowData, 'previousPeriodEarntPercentage', 0);
          } catch (error) {
            // Use default values if retrieval fails
            console.error('Error retrieving row data:', error);
          }
          
          // Create a simulated oldData object with the values we need
          const completeData = {
            ...change.data,
            totalHours,
            previousPeriodEarntPercentage
          };
          
          await processRowUpdate({
            key: change.key,
            newData: change.data,
            oldData: completeData,
            component: e.component
          });
        } catch (error) {
          console.error('Error processing change:', error);
        }
      }
      
      // After all changes are processed, refresh the grid
      e.component.refresh();
    };
    
    // Start processing changes
    processChanges().catch(error => {
      console.error('Error in processChanges:', error);
    });
  };
  
  // Process row updates based on what properties changed
  const processRowUpdate = (e: any) => {
    const { key, newData, oldData } = e;
    
    // Case 1: Updating both percentage and gate simultaneously
    if (newData.cumulativeEarntPercentage !== undefined && newData.deliverableGateGuid !== undefined) {
      return handleCombinedUpdate(key, newData, oldData);
    }
    
    // Case 2: Updating percentage only
    if (newData.cumulativeEarntPercentage !== undefined) {
      return handleProgressUpdate(key, newData, currentPeriod, oldData);
    }
    
    // Case 3: Updating gate only, with possible auto percentage
    if (newData.deliverableGateGuid !== undefined) {
      return handleGateUpdate(key, newData, oldData);
    }
    
    // Case 4: Updating other fields (default handler)
    return Promise.resolve();
  };
  
  // Handle combined updates to both percentage and gate
  const handleCombinedUpdate = (deliverableKey: string, newData: any, oldData: any) => {
    // Find the selected gate
    const selectedGate = deliverableGates.find(gate => 
      compareGuids(gate.guid, newData.deliverableGateGuid)
    );
    
    if (!selectedGate) {
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
      percentageToUse = selectedGate.autoPercentage ?? undefined;
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
    // Find the selected gate
    const selectedGate = deliverableGates.find(gate => 
      compareGuids(gate.guid, newData.deliverableGateGuid)
    );
    
    if (!selectedGate) {
      return Promise.reject('Selected gate not found');
    }
    
    // Use backend-provided value for previous period percentage
    const previousPeriodEarntPercentage = oldData.previousPeriodEarntPercentage || 0;
    
    // Check if we need to apply auto percentage
    if (selectedGate.autoPercentage !== null) {
      const currentPercentage = oldData.cumulativeEarntPercentage || 0;
      
      // Only apply auto percentage if it's higher than previous period percentage
      if (selectedGate.autoPercentage > previousPeriodEarntPercentage) {
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
    return updateDeliverableGate(deliverableKey, newData.deliverableGateGuid, userToken || '');
  };
  
  return {
    handleRowValidating,
    handleRowUpdating,
    handleSaving
  };
};
