import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAutoIncrement } from '../utils/useAutoIncrement';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { useVariations } from '../../contexts/variations/variations-context';
import { confirm, alert } from 'devextreme/ui/dialog';
import notify from 'devextreme/ui/notify';
import { EditorEvent } from '../../contexts/variations/variations-types';

/**
 * Helper function to extract and format variation error messages
 * Used by both approve and reject operations to provide consistent error handling
 */
function extractVariationErrorMessage(error: any, type: 'approve' | 'reject'): string {
  // Default error message
  let errorMessage = type === 'approve' ? 'Error approving variation' : 'Error rejecting variation';
  let detailedMessage = '';
  
  // Extract the detailed message from the error object
  if (error instanceof Error && error.message) {
    detailedMessage = error.message;
  } else if (error && typeof error === 'object' && 'response' in error) {
    // Try to get the detailed message from the server response
    const axiosError = error as { response?: { data?: string | any } };
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === 'string') {
        detailedMessage = axiosError.response.data;
      } else {
        detailedMessage = JSON.stringify(axiosError.response.data);
      }
    }
  }
  
  // Format messages based on type
  if (type === 'approve' && detailedMessage.includes('depends on unapproved variations')) {
    // Extract variation names for approval errors
    const variationMatch = detailedMessage.match(/Variation ([0-9]+)/g);
    
    if (variationMatch && variationMatch.length > 0) {
      const variationsList = variationMatch.join(', ');
      // Make variation numbers stand out with special formatting
      return `Cannot approve this variation because it depends on unapproved variations: [${variationsList}]. Please approve these variations first.`;
    } else {
      return `Cannot approve this variation because it depends on unapproved variations.
      Please approve dependent variations first.`;
    }
  } else if (type === 'reject' && detailedMessage.includes('deliverable') && detailedMessage.includes('variation')) {
    // Extract variation names for rejection errors
    const variationMatch = detailedMessage.match(/Variation ([0-9]+)/g);
    
    if (variationMatch && variationMatch.length > 0) {
      const variationsList = variationMatch.join(', ');
      // Make variation numbers stand out with special formatting
      return `Cannot reject this variation because its deliverables are used by: [${variationsList}]. Please reject these variations first.`;
    } else {
      return `Cannot reject this variation because its deliverables are used by other variations.
      Please reject dependent variations first.`;
    }
  }
  
  // For generic errors
  return detailedMessage || errorMessage;
}

/**
 * Hook for variation grid event handlers
 * Extracts the event handling logic from the component to reduce clutter
 */
export function useVariationGridHandlers({
  projectId,
  acquireToken,
}: {
  projectId?: string;
  acquireToken?: () => Promise<string | null>;
}) {
  // Get the variations context for validation, operations, and cache invalidation
  const { 
    // Validation methods
    handleRowValidating: contextHandleRowValidating,
    // Data operations (removed unused ones)
    changeVariationStatus,
    // Editor functions
    getDefaultVariationValues: contextGetDefaultVariationValues,
    handleVariationEditorPreparing: contextHandleEditorPreparing,
    handleVariationInitNewRow: contextHandleInitNewRow,
    // Cache invalidation
    invalidateAllLookups
  } = useVariations();
  // Add auto-increment hook to get the next variation number
  const { nextNumber: nextVariationNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: VARIATIONS_ENDPOINT,
    field: 'name',
    padLength: 3,
    startFrom: '001',
    filter: projectId ? `projectGuid eq ${projectId}` : undefined
  });

  // Use the context's row validating handler directly
  const handleRowValidating = useCallback((e: any) => {
    contextHandleRowValidating(e);
  }, [contextHandleRowValidating]);
  

  
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

      // Add created date if not provided
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
        
        // When insert completes, refresh the next number and invalidate caches
        if (result && result.then) {
          result.then(() => {
            // Refresh the next number for future additions
            refreshNextNumber();
            
            // Invalidate caches to ensure related data is refreshed
            invalidateAllLookups();
            
            // Restore original insert method
            store.insert = originalInsert;
          }).catch(() => {
            // Restore on error too
            store.insert = originalInsert;
          });
        } else {
          // Restore immediately if no promise
          store.insert = originalInsert;
        }
        
        return result;
      };
    }
  }, [projectId, nextVariationNumber, refreshNextNumber, invalidateAllLookups]);
  
  // Handle row removing using the method interception pattern
  const handleRowRemoving = useCallback((e: any) => {
    // We'll temporarily cancel the default behavior
    e.cancel = true;
    
    // Show confirmation dialog first
    confirm(
      'Are you sure you want to delete this variation?',
      'Confirm Deletion'
    ).then(confirmed => {
      if (!confirmed) return;
      
      try {
        // Get data source components
        const dataSource = e.component.getDataSource();
        const store = dataSource.store();
        const originalRemove = store.remove;
        
        // Override remove temporarily to know when it completes
        store.remove = function(key, ...args) {
          // Call original remove and get the promise
          const result = originalRemove.call(this, key, ...args);
          
          // When remove completes, refresh the next number and invalidate caches
          if (result && result.then) {
            result.then(() => {
              refreshNextNumber();
              invalidateAllLookups();
              
              // Restore original remove method
              store.remove = originalRemove;
              
              // Show success message
              alert('Variation deleted successfully', 'Success');
            }).catch((error) => {
              // Show error message
              alert(`Error deleting variation: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Error');
              
              // Restore on error too
              store.remove = originalRemove;
            });
          } else {
            // Restore immediately if no promise
            store.remove = originalRemove;
          }
          
          return result;
        };
        
        // Now perform the deletion - this needs to use a mechanism that will trigger
        // the intercepted store.remove method
        // We need to re-create what the grid would do naturally
        dataSource.store().remove(e.key)
          .then(() => {
            // Force grid to refresh after deletion
            setTimeout(() => {
              dataSource.reload();
            }, 50);
          });
      } catch (error) {
        // Show error message
        alert(`Error in deletion process: ${error instanceof Error ? error.message : 'Unknown error'}`, 'Error');
      }
    });
  }, [refreshNextNumber, invalidateAllLookups]);
  
  // Use the context's getDefaultVariationValues directly
  const getDefaultVariationValues = useCallback((projectIdParam: string): Record<string, any> => {
    // Call the context function
    return contextGetDefaultVariationValues(projectIdParam);
  }, [contextGetDefaultVariationValues]);
  
  // Handle value changed events from editors
  const onValueChanged = useCallback((args: any) => {
    // This is a simplified handler that could be expanded based on field requirements
    console.log('Value changed:', args);
    // No special handling needed now that business logic is in the context
  }, []);
  
  // Use the context's editor preparing handler directly
  const handleEditorPreparing = useCallback((e: EditorEvent) => {
    // Call the context's editor preparing handler
    contextHandleEditorPreparing(e);
    
    // Add any grid-specific behavior that's not in the context
    if (e.dataField) {
      // Save the original onValueChanged handler if it exists
      const originalSetValue = e.editorOptions.onValueChanged;
      
      // Replace with our own that will call the original after our logic
      e.editorOptions.onValueChanged = (args: any) => {
        onValueChanged(args);
        
        // Call the original handler if it existed
        if (originalSetValue) {
          originalSetValue(args);
        }
      };
    }
  }, [contextHandleEditorPreparing, onValueChanged]);
  
  // Use context handler directly for variation editor preparing
  const handleVariationEditorPreparing = useCallback((e: EditorEvent) => {
    contextHandleEditorPreparing(e);
  }, [contextHandleEditorPreparing]);
  
  // Handle initializing new row by using context function and adding auto-increment name
  const handleInitNewRow = useCallback((e: any) => {
    // Call the context's init new row handler
    contextHandleInitNewRow(e);
    
    // Add any grid-specific initialization that's not in the context
    if (e?.data) {
      // Apply auto-increment name if not already set
      if (nextVariationNumber && !e.data.name) {
        e.data.name = nextVariationNumber;
        refreshNextNumber();
      }
      
      // Ensure created date is set
      if (!e.data.created) {
        e.data.created = new Date();
      }
    }
  }, [contextHandleInitNewRow, nextVariationNumber, refreshNextNumber]);
  
  // Enhanced initialization is now handled directly in handleInitNewRow
  
  // Handle variation approval using the context-based change status function
  const handleApproveVariation = useCallback(async (variationGuid: string, variation?: any) => {
    try {
      // Check if variation has been submitted first - this is also verified in the backend
      if (variation && !variation.submitted) {
        alert('This variation must be submitted before it can be approved', 'Validation Error');
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
      
      // Call the context method directly with skipStateUpdate=true to prevent UI flickering
      await changeVariationStatus({ 
        variationId: variationGuid, 
        approve: true, 
        projectGuid: projectId || '',
        skipStateUpdate: true
      });
      
      // Show success message
      notify('Variation approved successfully', 'Success');
      return true;
    } catch (error: any) {
      console.error('Error approving variation:', error);
      
      // Use the shared helper function to extract and format the error message
      const errorMessage = extractVariationErrorMessage(error, 'approve');
      
      console.log('Extracted error message:', errorMessage);
      
      // Use alert dialog instead of toast notification for this specific error
      alert(errorMessage, 'Variation Approval Failed');
      return false;
    }
  }, [changeVariationStatus, projectId]);

  // Handle variation rejection using the context-based change status function
  const handleRejectVariation = useCallback(async (variationGuid: string) => {
    try {
      // Show confirmation dialog first
      const confirmed = await confirm(
        'Are you sure you want to reject this variation? This will revert all deliverables in this variation to unapproved status.',
        'Confirm Rejection'
      );
      
      if (!confirmed) {
        return false;
      }
      
      // Call the context method directly with skipStateUpdate=true to prevent grid refresh
      await changeVariationStatus({ 
        variationId: variationGuid, 
        approve: false, 
        projectGuid: projectId || '',
        skipStateUpdate: true // Prevent automatic state updates that would cause grid refresh
      });
      
      // Show success toast notification
      notify({
        message: 'Variation rejection processed successfully',
        type: 'success',
        displayTime: 2000,
        position: {
          at: 'top center',
          my: 'top center',
          offset: '0 10'
        }
      });
      return true;
    } catch (error) {
      console.error('Error rejecting variation:', error);
      
      // Use the shared helper function to extract and format the error message
      const errorMessage = extractVariationErrorMessage(error, 'reject');
      
      // Use alert dialog instead of toast notification for this specific error
      alert(errorMessage, 'Variation Rejection Failed');
      return false;
    }
  }, [changeVariationStatus, projectId]);

  return {
    // Grid row operations
    handleRowValidating,
    handleRowInserting,
    handleRowRemoving,
    
    // Editor operations
    handleEditorPreparing,
    handleInitNewRow,
    handleVariationEditorPreparing,
    getDefaultVariationValues,
    
    // Auto-increment
    nextVariationNumber,
    refreshNextNumber,
    
    // Status operations
    handleApproveVariation,
    handleRejectVariation
  };
}
