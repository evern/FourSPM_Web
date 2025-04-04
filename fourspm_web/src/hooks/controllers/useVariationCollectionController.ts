import { useCallback } from 'react';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import { Variation } from '../../types/odata-types';
import { useProjectInfo } from '../utils/useProjectInfo';
import { v4 as uuidv4 } from 'uuid';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';

/**
 * Default validation rules for variations
 */
const DEFAULT_VARIATION_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'name', 
    required: true, 
    maxLength: 500, 
    errorText: 'Name is required and must be less than 500 characters' 
  },
  { 
    field: 'comments', 
    required: false, 
    maxLength: 1000, 
    errorText: 'Comments must be less than 1000 characters' 
  }
];

/**
 * Project-specific variation controller interface with grid handlers and project data
 */
export interface ProjectVariationCollectionControllerHook extends GridOperationsHook<Variation> {
  handleInitNewRow: (e: any) => void;
  handleEditorPreparing: (e: any) => void;
  project: any;
  isLoadingProject: boolean;
  projectError: Error | null;
}

/**
 * Hook for managing variation data and grid operations in a project context
 * @param userToken The user authentication token
 * @param projectId The ID of the project to manage variations for
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules
 * @returns Object with variation data and grid operation handlers
 */
export const useVariationCollectionController = (
  userToken: string | undefined,
  projectId: string | undefined,
  gridConfig: GridOperationsConfig = {},
  validationRules: ValidationRule[] = DEFAULT_VARIATION_VALIDATION_RULES
): ProjectVariationCollectionControllerHook => {
  // Get project information from the context
  const { project, isLoading: isLoadingProject, error: projectError } = useProjectInfo(projectId, userToken);
  
  // Create collection hook for variations with integrated grid operations
  const collectionHook = createGridOperationHook<Variation>({
    ...gridConfig,
    validationRules,
    endpoint: VARIATIONS_ENDPOINT
  }, userToken) as GridOperationsHook<Variation>;
  
  /**
   * Handler for initializing a new row with default values for variation
   * @param e The row init event object containing the data property
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      e.data = {
        ...e.data,
        guid: uuidv4(),
        projectGuid: projectId,
        name: '',
        comments: ''
      };
    }
  }, [projectId]);

  /**
   * Handler for customizing editors based on field type
   * @param e The editor preparing event
   */
  const handleEditorPreparing = useCallback((e: any) => {
    // Additional customization for variation fields
    if (e.dataField === 'submitted' || e.dataField === 'clientApproved') {
      e.editorName = 'dxDateBox';
      e.editorOptions.displayFormat = 'yyyy-MM-dd';
    }
  }, []);

  // Return the enhanced hook with project-specific functionality
  return {
    ...collectionHook,
    handleInitNewRow,
    handleEditorPreparing,
    project,
    isLoadingProject,
    projectError
  };
};
