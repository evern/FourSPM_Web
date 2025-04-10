import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useVariationGridValidator } from './useVariationGridValidator';
import { useAutoIncrement } from '../utils/useAutoIncrement';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { alert, confirm } from 'devextreme/ui/dialog';

/**
 * Hook for variation grid event handlers
 * Extracts the event handling logic from the component to reduce clutter
 */
export function useVariationGridHandlers({
  projectId,
  userToken,
}: {
  projectId?: string;
  userToken?: string;
}) {
  // Add auto-increment hook to get the next variation number
  const { nextNumber: nextVariationNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: VARIATIONS_ENDPOINT,
    field: 'name',
    padLength: 3,
    startFrom: '001',
    filter: projectId ? `projectGuid eq ${projectId}` : undefined
  });

  // Use the shared entity validator for variations
  const {
    handleRowValidating: validatorHandleRowValidating,
    handleRowUpdating: validatorHandleRowUpdating,
    validateVariation
  } = useVariationGridValidator({
    userToken
  });
  
  // Wrap the validator's handleRowValidating to keep any variation-specific behavior
  const handleRowValidating = useCallback((e: any) => {
    // Call the validator's implementation first
    validatorHandleRowValidating(e);
    
    // If validation failed, we need to cancel the operation
    if (e.isValid === false) {
      e.cancel = true;
    }
  }, [validatorHandleRowValidating]);
  
  // Use the shared validator's row updating handler
  const handleRowUpdating = useCallback((e: any) => {
    // Let the validator handle the validation
    validatorHandleRowUpdating(e);
    
    // Grid will handle the update through its OData endpoint after validation
  }, [validatorHandleRowUpdating]);
  
  // Handle row inserting - let the grid handle the API call directly
  const handleRowInserting = useCallback((e: any) => {
    if (e.data) {
      // If a GUID is needed, we can add it here
      if (!e.data.guid) {
        e.data.guid = uuidv4();
      }
      
      // Set projectGuid if not already set
      if (!e.data.projectGuid && projectId) {
        e.data.projectGuid = projectId;
      }

      // Set name if not already set
      if (!e.data.name && nextVariationNumber) {
        e.data.name = nextVariationNumber;
      }

      // Add created date and user if not provided
      if (!e.data.created) {
        e.data.created = new Date();
      }

      // Watch for completion using native DataGrid CUD event pipeline
      const dataSource = e.component.getDataSource();

      // Create a one-time insert event handler on the store
      const store = dataSource.store();
      const originalInsert = store.insert;
      
      // Override insert temporarily to know when it completes
      store.insert = function(values, ...args) {
        // Call original insert and get the promise
        const result = originalInsert.call(this, values, ...args);
        
        // When insert completes, refresh the next number
        if (result && result.then) {
          result.then(() => {
            refreshNextNumber();
            
            // Restore original insert method
            store.insert = originalInsert;
          });
        } else {
          // Restore immediately if no promise
          store.insert = originalInsert;
        }
        
        return result;
      };
    }
  }, [projectId, nextVariationNumber, refreshNextNumber]);
  
  // Handle row removing - let the grid handle the API call directly
  const handleRowRemoving = useCallback((e: any) => {
    // Grid will handle the deletion through its OData endpoint
    // Watch for completion of delete operation
    const dataSource = e.component.getDataSource();
    const store = dataSource.store();
    const originalRemove = store.remove;
    
    // Override remove temporarily to know when it completes
    store.remove = function(key, ...args) {
      // Call original remove and get the promise
      const result = originalRemove.call(this, key, ...args);
      
      // When remove completes, refresh the next number
      if (result && result.then) {
        result.then(() => {
          refreshNextNumber();
          
          // Restore original remove method
          store.remove = originalRemove;
        });
      } else {
        // Restore immediately if no promise
        store.remove = originalRemove;
      }
      
      return result;
    };
  }, [refreshNextNumber]);
  
  // Handle editor preparing - customize editors for specific fields
  const handleEditorPreparing = useCallback((e: any) => {
    const { dataField } = e;
    
    // Customize date editors
    if (dataField === 'submitted' || dataField === 'clientApproved') {
      e.editorName = 'dxDateBox';
      e.editorOptions.displayFormat = 'yyyy-MM-dd';
    }
  }, [userToken]);
  
  // Handle initializing new row
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Set default values for new variation
      e.data = {
        ...e.data,
        guid: e.data.guid || uuidv4(),
        projectGuid: e.data.projectGuid || projectId || '',
        name: e.data.name || nextVariationNumber || '',
        comments: '',
        created: new Date()
      };
      
      // Refresh the next number for subsequent additions
      refreshNextNumber();
    }
  }, [projectId, nextVariationNumber, refreshNextNumber]);
  
  // Handle variation approval
  const handleApproveVariation = useCallback(async (variationGuid: string, variation?: any) => {
    try {
      // Check if variation has been submitted first - this is also verified in the backend
      if (variation && !variation.submitted) {
        alert('This variation must be submitted before it can be approved', 'Validation Error');
        return false;
      }
      
      // Use token from hook parameters
      if (!userToken) {
        alert('User token not available. Please log in again.', 'Authentication Error');
        return false;
      }
      
      // Show confirmation dialog first
      const confirmed = await confirm(
        'Are you sure you want to approve this variation? This will update all deliverables in this variation to approved status.',
        'Confirm Approval'
      );
      
      if (!confirmed) {
        return false;
      }
      
      // Import the adapter function dynamically to avoid circular dependencies
      const { approveVariation } = await import('../../adapters/variation.adapter');
      
      // Call the adapter method to approve the variation
      await approveVariation(variationGuid, userToken);
      
      // Show success message
      alert('Variation approved successfully', 'Success');
      return true;
    } catch (error) {
      console.error('Error approving variation:', error);
      alert(`Error approving variation: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Error');
      return false;
    }
  }, [userToken]);

  // Handle variation rejection
  const handleRejectVariation = useCallback(async (variationGuid: string) => {
    try {
      // Use token from hook parameters
      if (!userToken) {
        alert('User token not available. Please log in again.', 'Authentication Error');
        return false;
      }
      // Show confirmation dialog first
      const confirmed = await confirm(
        'Are you sure you want to reject this variation? This will revert all deliverables in this variation to unapproved status.',
        'Confirm Rejection'
      );
      
      if (!confirmed) {
        return false;
      }
      
      // Import the adapter function dynamically to avoid circular dependencies
      const { rejectVariation } = await import('../../adapters/variation.adapter');
      
      // Call the adapter method to reject the variation
      await rejectVariation(variationGuid, userToken);
      
      // Show success message
      alert('Variation rejection processed successfully', 'Success');
      return true;
    } catch (error) {
      console.error('Error rejecting variation:', error);
      alert(`Error rejecting variation: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Error');
      return false;
    }
  }, [userToken]);

  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleEditorPreparing,
    handleInitNewRow,
    validateVariation,
    nextVariationNumber,
    refreshNextNumber,
    handleApproveVariation,
    handleRejectVariation
  };
}
