import { useCallback } from 'react';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import { Client } from '../../types/index';
import { useAutoIncrement } from '../utils/useAutoIncrement';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default validation rules for clients
 */
const DEFAULT_CLIENT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'number', required: true, maxLength: 3, errorText: 'Client Number must be at most 3 characters' },
  { field: 'description', maxLength: 500, errorText: 'Description must be at most 500 characters' },
  { field: 'clientContactName', maxLength: 500, errorText: 'Contact Name must be at most 500 characters' },
  { field: 'clientContactNumber', maxLength: 100, errorText: 'Contact Phone must be at most 100 characters' },
  { 
    field: 'clientContactEmail', 
    maxLength: 100, 
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
    errorText: 'Please enter a valid email address' 
  }
];

/**
 * Interface for Client data hook - combines collection operations with client-specific functionality
 */
export interface ClientCollectionControllerHook extends GridOperationsHook<Client> {
  nextNumber: string;
  refreshNextNumber: () => void;
  handleInitNewRow: (e: any) => void;
}

/**
 * Hook to manage client data operations
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing client data state and handler functions
 */
export const useClientCollectionController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_CLIENT_VALIDATION_RULES
): ClientCollectionControllerHook => {
  // Create collection hook for clients with integrated grid operations and validation
  // Use gridEnabled=true to ensure all grid handlers are implemented
  const collectionHook = createGridOperationHook<Client>({
    endpoint: gridConfig?.endpoint,
    // Spread all grid operation callbacks directly
    ...gridConfig,
    validationRules 
  }, userToken) as GridOperationsHook<Client>; 
  
  // Add auto-increment hook to get the next client number
  const { nextNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: gridConfig?.endpoint || '',
    field: 'number',
    padLength: 3,
    startFrom: '001'
  });

  // Initialize new row with default values including auto-incremented number
  const handleInitNewRow = useCallback((e: any) => {
    e.data = {
      guid: uuidv4(),
      number: nextNumber,
      ...e.data
    };
    refreshNextNumber();
  }, [nextNumber, refreshNextNumber]);

  return {
    ...collectionHook,
    nextNumber,
    refreshNextNumber,
    handleInitNewRow
  };
};
