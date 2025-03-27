import { useCallback } from 'react';
import { Project } from '../../types/index';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '../../types/odata-types';
import { useAutoIncrement } from '../utils/useAutoIncrement';
import { useAuth } from '../../contexts/auth';
import ODataStore from 'devextreme/data/odata/store';
import { useClientDataProvider } from '../data-providers/useClientDataProvider';

/**
 * Default validation rules for projects
 */
const DEFAULT_PROJECT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'projectNumber', required: true, maxLength: 2, errorText: 'Project Number must be at most 2 characters' },
  { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
  { field: 'clientGuid', required: true, errorText: 'Client is required' }
];

/**
 * Interface for Project collection controller hook (for grid/list operations)
 */
export interface ProjectCollectionControllerHook extends GridOperationsHook<Project> {
  // Project-specific collection operations
  handleInitNewRow: (e: any) => void;
  // Client data - only expose what's needed
  clientsStore: ODataStore;
  // Auto increment properties
  refreshNextNumber: () => void;
}

/**
 * Hook to manage project collection data operations (grid/list view)
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing project collection state and handler functions
 */
export const useProjectCollectionController = (
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_PROJECT_VALIDATION_RULES
): ProjectCollectionControllerHook => {
  // Get authenticated user
  const { user } = useAuth();
  const userToken = user?.token;

  // Create a collection hook for projects grid operations
  const collectionHook = createGridOperationHook<Project>({
    // Spread all grid operation callbacks directly
    ...gridConfig,
    validationRules
  }, userToken) as GridOperationsHook<Project>;

  // Get autoincrement functionality for project numbers
  const { nextNumber: nextProjectNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: gridConfig?.endpoint || '',
    field: 'projectNumber',
    padLength: 2,
    startFrom: '01'
  });

  // Get client data using the data provider pattern - but keep internal access to what's needed for validation
  const { 
    clientsStore
  } = useClientDataProvider();

  /**
   * Handler for initializing a new row with default values for projects
   * @param e The row init event object
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Set default values for new project
      e.data = {
        ...e.data,
        guid: e.data.guid || uuidv4(),
        projectNumber: nextProjectNumber,
        projectStatus: e.data.projectStatus || 'TenderInProgress' // Default status
      };
    }
  }, [nextProjectNumber]);

  return {
    ...collectionHook,
    handleInitNewRow,
    clientsStore,
    refreshNextNumber
  };
};
