import { useCallback, useState, useMemo } from 'react';
import { Project } from '../../types/index';
import { getProjectDetails, updateProject } from '../../adapters/project.adapter';
import { createEntityHook } from '../factories/createEntityHook';
import { createCollectionHook } from '../factories/createCollectionHook';
import { EntityHook, EntityRelatedOperation } from '../interfaces/entity-hook.interfaces';
import { GridEnabledCollectionHook, ValidationRule, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { getClientDetails } from '../../adapters/client.adapter';
import notify from 'devextreme/ui/notify';
import { calculateCurrentPeriod } from '../../utils/period-utils';
import { sharedApiService } from '../../api/shared-api.service';

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
export interface ProjectControllerHook extends GridEnabledCollectionHook<Project> {
  // Project-specific collection state
}

/**
 * Interface for Project entity controller hook (for single entity operations)
 */
export interface ProjectEntityControllerHook extends EntityHook<Project> {
  // Project-specific entity state
  project: Project | null;
  currentPeriod: number | null;
  updateProjectClient: (clientId: string) => Promise<Project | null>;
}

/**
 * Hook to manage project collection data operations (grid/list view)
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing project collection state and handler functions
 */
export const useProjectController = (
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_PROJECT_VALIDATION_RULES
): ProjectControllerHook => {
  // Create a collection hook for projects grid operations
  const collectionHook = createCollectionHook<Project>({
    services: {
      getAll: (_options, token) => {
        if (!token) throw new Error('Token is required');
        const endpoint = gridConfig?.endpoint || '';
        if (!endpoint) throw new Error('Endpoint is required');
        return sharedApiService.get<Project[]>(endpoint, token);
      }
    },
    callbacks: {
      onError: (error, operation) => console.error(`Error in Project operation (${operation}):`, error),
      ...gridConfig
    },
    validationRules
  }, userToken, true) as GridEnabledCollectionHook<Project>;

  return {
    ...collectionHook
  };
};

/**
 * Hook to manage single project entity operations (detail view)
 * @param projectId The project GUID to edit
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @returns Object containing project entity state and handler functions
 */
export const useProjectEntityController = (
  projectId: string | undefined, 
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig
): ProjectEntityControllerHook => {
  // State for project-specific data that's not part of the entityHook
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);

  // Create the client-related operation for loading client details and updating project
  const clientRelatedOperation: EntityRelatedOperation<Project, any> = {
    getRelatedId: (entity: Project) => entity.clientGuid ?? null, // Convert undefined to null
    loadRelated: (clientId: string, token: string) => getClientDetails(clientId, token),
    updateEntity: (entity: Project, clientData: any) => ({
      ...entity,
      client: clientData
    })
  };

  // Standard getById function implementation
  const getByIdFunction = useCallback((id: string, token: string): Promise<Project> => {
    return getProjectDetails(id, token);
  }, []);

  // Create entity hook for project data with enhanced functionality
  const entityHook = createEntityHook<Project>({
    services: {
      getById: getByIdFunction,
      update: (id, data) => updateProject(id, data, userToken || '')
    },
    callbacks: {
      onLoadSuccess: (result) => {
        if (result && 'progressStart' in result) {
          // Set current period based on project start date
          if (result.progressStart) {
            const period = calculateCurrentPeriod(new Date(result.progressStart));
            setCurrentPeriod(period);
          }
        }
      },
      onUpdateSuccess: async (result) => {
        if (!result || !userToken) return;
        
        // If client info needs to be loaded, use loadRelatedEntity
        if (result.clientGuid && (!result.client || !result.client.description)) {
          try {
            await entityHook.loadRelatedEntity?.(clientRelatedOperation);
          } catch (clientErr) {
            console.error('Error loading client details after update:', clientErr);
          }
        }

        // Trigger the grid's success callback if provided
        if (gridConfig?.onUpdateSuccess) {
          gridConfig.onUpdateSuccess();
        }
      }
    },
    // Auto-load the project when component mounts if projectId is available
    autoLoadId: projectId
  }, userToken);

  /**
   * Update project client by ID - Now using the standardized loadRelatedEntity
   */
  const updateProjectClient = useCallback(async (clientId: string): Promise<Project | null> => {
    if (!entityHook.entity.data || !userToken) return null;
    
    try {
      // Create a custom related operation for this specific client ID
      const specificClientOperation: EntityRelatedOperation<Project, any> = {
        ...clientRelatedOperation,
        getRelatedId: () => clientId // Override to use the provided clientId
      };
      
      // Use the standard loadRelatedEntity function
      return await entityHook.loadRelatedEntity?.(specificClientOperation) || null;
    } catch (error) {
      console.error('Error updating project client:', error);
      notify(`Error updating client: ${error}`, 'error', 3000);
      return null;
    }
  }, [entityHook, userToken, clientRelatedOperation]);

  // Memoize the project data to prevent unnecessary re-renders
  const project = useMemo(() => {
    const data = entityHook.entity.data;
    if (!data) return null;
    
    return {
      guid: data.guid,
      projectNumber: data.projectNumber,
      name: data.name || '', // Convert null to empty string
      progressStart: data.progressStart ? new Date(data.progressStart) : new Date(),
      projectStatus: data.projectStatus,
      created: data.created || new Date().toISOString() // Add the required created property
    };
  }, [entityHook.entity.data]); // Only recalculate when entity.data changes

  return {
    ...entityHook,
    project,
    currentPeriod,
    updateProjectClient
  };
};
