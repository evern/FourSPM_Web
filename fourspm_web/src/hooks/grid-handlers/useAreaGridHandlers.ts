import { useCallback, useState } from 'react';
import { createGridOperationHook } from '@/hooks/factories/createGridOperationHook';
import { AREAS_ENDPOINT } from '@/config/api-endpoints';
import { ValidationRule } from '@/hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { useAreas } from '@/contexts/areas/areas-context';

interface UseAreaGridHandlersProps {
  acquireToken?: () => Promise<string | null>;
}

/**
 * Get the next available area number for a project
 * @param projectId The project GUID
 * @param token User authentication token
 */
async function getNextAreaNumber(projectId: string, token?: string): Promise<string> {
  try {
    // Call the API endpoint for getting next area number
    const response = await fetch(`/api/projects/${projectId}/areas/next-number`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get next area number');
    }
    
    const data = await response.json();
    return data.nextNumber || '01'; // Default if not available
  } catch (error) {
    // Error handled with fallback return
    return '01'; // Default fallback
  }
}

/**
 * Custom hook for area grid operations
 * Provides handlers for grid events and validation
 * Following the Reference Data Implementation Doctrine
 */
export function useAreaGridHandlers({ acquireToken }: UseAreaGridHandlersProps) {
  // Get the areas context for error reporting and cache invalidation
  const { setError, invalidateAllLookups, projectId } = useAreas();
  
  // State to track the next available area number
  const [nextAreaNumber, setNextAreaNumber] = useState<string>('');
  
  // Default validation rules for areas
  const AREA_VALIDATION_RULES: ValidationRule[] = [
    { 
      field: 'areaNumber', 
      required: true, 
      maxLength: 20,
      errorText: 'Area Number is required and cannot exceed 20 characters' 
    },
    { 
      field: 'name', 
      required: true, 
      maxLength: 500,
      errorText: 'Name is required and cannot exceed 500 characters' 
    }
  ];

  // Use the grid operation hook factory with Area-specific configuration
  const gridOperations = createGridOperationHook({
    endpoint: AREAS_ENDPOINT,
    validationRules: AREA_VALIDATION_RULES,
    
    // Error handlers
    onUpdateError: (error) => {

      setError('Failed to update area: ' + error.message);
    },
    onDeleteError: (error) => {

      setError('Failed to delete area: ' + error.message);
    },
    onInsertError: (error) => {

      setError('Failed to create area: ' + error.message);
    },
    invalidateCache: invalidateAllLookups,
    defaultValues: {
      guid: uuidv4(),
      projectGuid: projectId,
      areaNumber: '',
      name: '',
    },
    acquireToken
  });
  
  // Extract all the handlers from the grid operations hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
  } = gridOperations;
  
  // Function to refresh the next available area number
  const refreshNextNumber = useCallback(async () => {
    if (projectId && acquireToken) {
      try {
        // Get a fresh token for the API call
        const token = await acquireToken();
        if (token) {
          const nextNumber = await getNextAreaNumber(projectId, token);
          setNextAreaNumber(nextNumber);
          return nextNumber;
        }
      } catch (error) {
        // Error handled silently
      }
    }
    return null;
  }, [projectId, acquireToken]);
  
  // Handle grid initialization
  const handleGridInitialized = useCallback((e: any) => {

    // Refresh next number when grid initializes
    refreshNextNumber();
  }, [refreshNextNumber]);
  
  // Return all handlers for use in the component
  return {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized,
    refreshNextNumber,
    nextAreaNumber
  };
}
