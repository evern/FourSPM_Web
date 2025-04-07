import { useCallback, useMemo } from 'react';
import { Project } from '../../types/index';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '../../types/odata-types';
import { useAuth } from '../../contexts/auth';
import ODataStore from 'devextreme/data/odata/store';
import { useClientDataProvider } from '../data-providers/useClientDataProvider';

/**
 * Default validation rules for projects
 */
const DEFAULT_PROJECT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'projectNumber', required: true, maxLength: 2, errorText: 'Project Number must be at most 2 characters' },
  { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
  { field: 'projectStatus', required: true, errorText: 'Project Status is required' },
  { field: 'clientGuid', required: true, errorText: 'Client is required' }
];

/**
 * Interface for ProjectNew collection controller hook (for grid/list operations)
 */
export interface ProjectNewCollectionControllerHook extends GridOperationsHook<Project> {
  // Project-specific collection operations
  handleInitNewRow: (e: any) => void;
}

/**
 * Simplified hook to manage project collection data operations
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing project collection state and handler functions
 */
export const useProjectNewCollectionController = (
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_PROJECT_VALIDATION_RULES
): ProjectNewCollectionControllerHook => {
  // Get authenticated user
  const { user } = useAuth();
  const userToken = user?.token;

  // Console log to track controller creation
  console.log('useProjectNewCollectionController: Creating new controller instance');

  // Memoize grid config to prevent recreating hooks
  const memoizedGridConfig = useMemo(() => ({
    ...gridConfig,
    validationRules
  }), [gridConfig, validationRules]);

  // Create a collection hook for projects grid operations
  // IMPORTANT: Don't call hooks inside useMemo or other hooks
  const collectionHook = createGridOperationHook<Project>(
    memoizedGridConfig, 
    userToken
  ) as GridOperationsHook<Project>;
  
  // Log when collection hook is created
  console.log('Collection hook created');
  
  // No more clientsStore dependency in the controller
  // The parent component will provide this if needed

  /**
   * Handler for initializing a new row with default values for projects
   * @param e The row init event object
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      console.log('Initializing new row with defaults');
      // Set default values for new project
      e.data = {
        ...e.data,
        guid: e.data.guid || uuidv4(),
        projectStatus: e.data.projectStatus || 'TenderInProgress' // Default status
      };
    }
  }, []);

  // Use memoized return value to prevent re-renders
  return useMemo(() => ({
    ...collectionHook,
    handleInitNewRow
  }), [collectionHook, handleInitNewRow]);
};
