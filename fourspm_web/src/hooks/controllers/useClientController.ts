import { useCallback } from 'react';
import { createCollectionHook } from '../factories/createCollectionHook';
import { GridEnabledCollectionHook, ValidationRule, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { getClients } from '../../adapters/client.adapter';
import { Client } from '../../types/index';

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
export interface ClientControllerHook extends GridEnabledCollectionHook<Client> {
  handleRowValidating: (additionalRules?: ValidationRule[]) => (e: any) => void; 
}

/**
 * Hook to manage client data operations
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing client data state and handler functions
 */
export const useClientController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_CLIENT_VALIDATION_RULES
): ClientControllerHook => {
  // Create collection hook for clients with integrated grid operations and validation
  // Use gridEnabled=true to ensure all grid handlers are implemented
  const collectionHook = createCollectionHook<Client>({
    services: {
      getAll: (_options, token) => getClients(token || '')
    },
    callbacks: {
      endpoint: gridConfig?.endpoint, 
      onError: (error, operation) => {
        console.error(`Error in Client operation (${operation}):`, error);
      },
      ...gridConfig
    },
    validationRules 
  }, userToken, true) as GridEnabledCollectionHook<Client>; 
  
  // Create handleRowValidating to match what's used in clients.tsx
  const handleRowValidating = (additionalRules: ValidationRule[] = []) => {
    return (e: any) => {
      console.log('Client validation triggered with data:', e.data);
      if (collectionHook.onRowValidating) {
        collectionHook.onRowValidating(e);
      }
    };
  };
  
  // Wrap handleRowInserting to add client-specific debugging
  const { handleRowInserting: baseHandleRowInserting } = collectionHook;
  const handleRowInserting: typeof baseHandleRowInserting = useCallback((e) => {
    return baseHandleRowInserting?.(e);
  }, [baseHandleRowInserting, gridConfig]);
  
  return {
    // Collection hook properties and methods
    ...collectionHook,
    handleRowValidating,
    handleRowInserting // Override with our debugging version
  };
};
