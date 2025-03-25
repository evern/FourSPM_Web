import { useCallback, useState, useEffect } from 'react';
import { createCollectionHook } from '../factories/createCollectionHook';
import { GridEnabledCollectionHook, ValidationRule, ProjectControllerBase, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { getAreas } from '../../adapters/area.adapter';
import { fetchProject } from '../../adapters/project.adapter';
import { Project } from '../../types/index';
import { Area } from '../../types/odata-types';

/**
 * Default validation rules for areas
 */
const DEFAULT_AREA_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'number', 
    required: true, 
    maxLength: 2,
    pattern: /^[0-9][0-9]$/,
    errorText: 'Area Number must be exactly 2 digits (00-99)' 
  },
  { field: 'description', required: true, maxLength: 100, errorText: 'Description is required and must be less than 100 characters' }
];

/**
 * Basic Area controller interface with CRUD operations
 */
export interface AreaControllerHook extends GridEnabledCollectionHook<Area> {
  // Base hook now uses GridEnabledCollectionHook which guarantees grid operation handlers
}

/**
 * Project-specific area controller interface with grid handlers and project data
 */
export interface ProjectAreaControllerHook extends AreaControllerHook, ProjectControllerBase<Area> {
  // Uses all standard grid and project functionality from base interfaces
}

/**
 * Hook to manage area data operations without project-specific functionality
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing area data state and handler functions
 */
export function useAreaController(
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_AREA_VALIDATION_RULES,
  projectId?: string
): AreaControllerHook {
  
  // Create collection hook for areas with integrated grid operations and validation
  const collectionHook = createCollectionHook<Area>({
    services: {
      getAll: (options, token) => {
        if (!token) throw new Error('Token is required');
        // Extract projectId from options
        const projectId = options?.projectId || options?.filter?.projectGuid;
        return getAreas(token || '', projectId);
      }
    },
    initialFilter: projectId ? { projectId } : undefined,
    callbacks: {
      onError: (error, operation) => {
        console.error(`Error in Area operation (${operation}):`, error);
      },
      // Spread all grid operation callbacks directly
      ...gridConfig
    },
    validationRules
  }, userToken, true) as GridEnabledCollectionHook<Area>;
  
  return {
    ...collectionHook
  };
}

/**
 * Project-specific hook to manage area data operations with project context
 * @param userToken The user's authentication token
 * @param projectId Project ID to enable project-specific functionality
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing area data with project context
 */
export function useAreaControllerWithProject(
  userToken: string | undefined,
  projectId: string,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_AREA_VALIDATION_RULES
): ProjectAreaControllerHook {
  // Get basic area controller
  const baseHook = useAreaController(userToken, gridConfig, validationRules, projectId);
  
  // Local state for project-specific functionality
  const [gridInstance, setGridInstance] = useState<any>(null);
  const [project, setProject] = useState<Project | null>(null);

  // Initialize new row with default values for area
  const handleInitNewRow = useCallback((e: any) => {
    // This is handled in the component for areas since it uses the nextAreaNumber
    // from the useAutoIncrement hook
  }, []);

  // Save grid instance for later use
  const handleGridInitialized = useCallback((e: any) => {
    setGridInstance(e.component);
  }, []);

  // Fetch project info when component mounts
  useEffect(() => {
    if (!userToken || !projectId) return;
    
    const getProjectInfo = async () => {
      try {
        const project = await fetchProject(projectId, userToken);
        setProject(project);
      } catch (error) {
        console.error('Error fetching project info:', error);
      }
    };
    
    getProjectInfo();
  }, [projectId, userToken]);
  
  // Return the enhanced hook with project-specific functionality
  return {
    ...baseHook,
    handleInitNewRow,
    handleGridInitialized,
    project,
    gridInstance,
    setGridInstance
  };
};
