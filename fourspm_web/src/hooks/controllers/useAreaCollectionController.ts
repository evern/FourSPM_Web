import { useCallback } from 'react';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule, GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import { Area } from '../../types/odata-types';
import { useProjectInfo } from '../utils/useProjectInfo';
import { v4 as uuidv4 } from 'uuid';
import { useAutoIncrement } from '../utils/useAutoIncrement';
import { useAreaDataProvider } from '../data-providers/useAreaDataProvider';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';

/**
 * Default validation rules for areas
 */
const DEFAULT_AREA_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'number', 
    required: true, 
    pattern: /^\d{2}$/,
    errorText: 'Area Number must be exactly 2 digits (00-99)' 
  },
  { 
    field: 'description', 
    required: true, 
    maxLength: 100, 
    errorText: 'Description is required and must be less than 100 characters' 
  }
];

/**
 * Project-specific area controller interface with grid handlers and project data
 */
export interface ProjectAreaCollectionControllerHook extends GridOperationsHook<Area> {
  handleInitNewRow: (e: any) => void;
  nextAreaNumber: string;
  refreshNextNumber: () => void;
  areas: Area[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for managing area data and grid operations in a project context
 * @param projectId The ID of the project to manage areas for
 * @param gridConfig Optional configuration for grid operations
 * @param validationRules Optional validation rules
 * @returns Object with area data and grid operation handlers
 */
export const useAreaCollectionController = (
  projectId: string | undefined,
  gridConfig: GridOperationsConfig = {},
  validationRules: ValidationRule[] = DEFAULT_AREA_VALIDATION_RULES
): ProjectAreaCollectionControllerHook => {
  // Use the new area data provider 
  const { areas, areasStore, isLoading, error } = useAreaDataProvider(projectId);
  
  // Create collection hook for areas with integrated grid operations
  const collectionHook = createGridOperationHook<Area>({
    ...gridConfig,
    validationRules,
    endpoint: AREAS_ENDPOINT // Ensure we're using the constant endpoint
  }) as GridOperationsHook<Area>;
  
  // Add auto-increment hook to get the next area number
  const { nextNumber: nextAreaNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: AREAS_ENDPOINT,
    field: 'number',
    padLength: 2,
    startFrom: '01',
    filter: projectId ? `projectGuid eq ${projectId}` : undefined
  });

  /**
   * Handler for initializing a new row with default values for area
   * @param e The row init event object containing the data property
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      e.data = {
        ...e.data,
        guid: uuidv4(),
        projectGuid: projectId,
        number: nextAreaNumber,
        description: ''
      };
    }
  }, [projectId, nextAreaNumber]);

  // Return the enhanced hook with project-specific functionality
  return {
    ...collectionHook,
    handleInitNewRow,
    nextAreaNumber,
    refreshNextNumber,
    areas,
    isLoading,
    error
  };
};
