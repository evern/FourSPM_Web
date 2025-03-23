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
            
            // We need to include the period in the request to get correct calculated values
            // Using the store's byKey method doesn't include the period parameter
            // Instead, let's create a custom load options to include the period
            const loadOptions = {
              filter: [
                ["guid", "=", change.key],
                "and",
                ["period", "=", currentPeriod]
              ]
            };
            
            // Load the data with our custom filter
            const results = await dataSource.load(loadOptions);
            const rowData = results && results.length > 0 ? results[0] : null;
            
            if (rowData) {
              // Extract the values using our utility function
              totalHours = extractRowValue(rowData, 'totalHours', 0);
              previousPeriodEarntPercentage = extractRowValue(rowData, 'previousPeriodEarntPercentage', 0);
              
              // Create a properly structured oldData object with the original values
              const completeData = {
                ...rowData,  // Include all original data
                totalHours,  // Ensure these calculated fields are set correctly
                previousPeriodEarntPercentage
              };
              
              await processRowUpdate({
                key: change.key,
                newData: change.data,
                oldData: completeData,  // Use the full original data
                component: e.component
              });
            } else {
              // If we couldn't get the row data, still try to process with limited info
              const completeData = {
                totalHours,
                previousPeriodEarntPercentage
              };
              
              await processRowUpdate({
                key: change.key,
                newData: change.data,
                oldData: completeData,
                component: e.component
              });
            }
          } catch (error) {
            // Use default values if retrieval fails
          }
        } catch (error) {
          // Handle errors during processing
          e.component.refresh();
        }
      }
      
      // Refresh the grid after all changes are processed
      e.component.refresh();
    };
    
    // Start processing the changes
    processChanges();
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
