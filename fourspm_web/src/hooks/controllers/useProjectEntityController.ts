import { useCallback } from 'react';
import { Project } from '../../types/index';
import { fetchProject, updateProject } from '../../adapters/project.adapter';
import { getClientDetails } from '../../adapters/client.adapter';
import { createEntityHook } from '../factories/createEntityHook';
import { createFormOperationHook, FormOperationsHook } from '../factories/createFormOperationHook';
import { EntityHook, EntityRelatedOperation } from '../interfaces/entity-hook.interfaces';
import { GridOperationsConfig } from '../interfaces/grid-operation-hook.interfaces';
import notify from 'devextreme/ui/notify';
import { useClientDataProvider } from '../data-providers/useClientDataProvider';
import { Client } from '../../types/odata-types';
import { useAuth } from '../../contexts/auth';

// Extended grid config to include entity operations callbacks
interface ProjectOperationsConfig extends GridOperationsConfig {
  onCreateSuccess?: (result: Project) => void;
  onUpdateSuccess?: () => void;
  onCancelEditing?: (originalData?: any) => void;
}

/**
 * Interface for Project entity controller hook (for single entity operations)
 */
export interface ProjectEntityControllerHook extends EntityHook<Project>, FormOperationsHook<Project> {
  // Client data and selection
  clients: Client[];
  isClientLoading: boolean;
  
  // Client operations
  handleClientSelectionChange: (e: any) => void;
  updateProjectClient: (clientId: string) => Promise<Project | null>;
  updateClientFields: (clientId: string) => Promise<boolean>;
}

/**
 * Hook to manage single project entity operations (detail view)
 * @param projectId The project GUID to edit
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @returns Object containing project entity state and handler functions
 */
export const useProjectEntityController = (
  projectId?: string,
  gridConfig?: ProjectOperationsConfig
): ProjectEntityControllerHook => {
  // Get authenticated user
  const { user } = useAuth();
  const userToken = user?.token;

  // Standard getById function implementation
  const getByIdFunction = useCallback((id: string, token: string): Promise<Project> => {
    return fetchProject(id, token);
  }, []);

  // Get clients using the standardized hook
  const { clients, isLoading: isClientLoading } = useClientDataProvider();
  
  // Create the client-related operation for loading client details and updating project
  const clientRelatedOperation: EntityRelatedOperation<Project, Client> = {
    getRelatedId: (entity: Project) => entity.clientGuid ?? null, // Convert undefined to null
    loadRelated: (clientId: string, token: string) => getClientDetails(clientId, token),
    updateEntity: (entity: Project, clientData: Client) => ({
      ...entity,
      client: clientData
    })
  };

  // Create entity hook for project data with enhanced functionality
  const entityHook = createEntityHook<Project>({
    services: {
      getById: getByIdFunction,
      update: (id, data) => updateProject(id, data, userToken || ''),
      create: (data) => {
        // Create functionality without importing createProject
        return updateProject('', data, userToken || '');
      }
    },
    callbacks: {
      onLoadSuccess: async (result) => {
        // Immediately load client details if needed
        if (result?.clientGuid && (!result.client || !result.client.description)) {
          try {
            await entityHook.loadRelatedEntity?.(clientRelatedOperation);
          } catch (clientErr) {
            notify('Error loading client details', 'error', 3000);
          }
        }
      },
      onError: (error, operation) => {
        // Handle both load and other errors
        if (operation === 'load') {
          notify('Error loading project', 'error', 3000);
        } else {
          notify(`Error in operation ${operation}`, 'error', 3000);
        }
      },
      onUpdateSuccess: async (result) => {
        notify('Project updated successfully', 'success', 3000);
        
        if (result && userToken) {
          // If client info needs to be loaded, use loadRelatedEntity
          if (result.clientGuid && (!result.client || !result.client.description)) {
            try {
              await entityHook.loadRelatedEntity?.(clientRelatedOperation);
            } catch (clientErr) {
              notify('Error loading client details after update', 'error', 3000);
            }
          }
        }
        
        if (gridConfig?.onUpdateSuccess) {
          gridConfig.onUpdateSuccess();
        }
      },
      onCreateSuccess: (result) => {
        notify('Project created successfully', 'success', 3000);
        
        if (gridConfig?.onCreateSuccess) {
          gridConfig.onCreateSuccess(result);
        }
      }
    },
    // Auto-load the project when component mounts if projectId is available
    autoLoadId: projectId
  }, userToken);
  
  // Create form operations hook for form manipulation
  const formHook = createFormOperationHook<Project>({
    onSaveSuccess: (result) => {
      // Success handled by entity callbacks
    },
    onSaveError: (error) => {
      // Error handled by entity callbacks
    },
    // Use the standardized lookupFields configuration 
    lookupFields: [
      {
        idField: 'clientGuid', 
        objectField: 'client',
        // Define related fields that should be updated when client changes
        relatedFields: ['clientContactName', 'clientContactNumber', 'clientContactEmail'],
        // Define the function to load client details when selection changes
        loadRelatedData: async (clientId: string) => {
          if (!userToken) return null;
          try {
            return await getClientDetails(clientId, userToken);
          } catch (error) {
            notify('Error loading client details', 'error', 3000);
            return null;
          }
        }
      }
      // Add other lookup fields as needed (e.g., discipline, area, etc.)
    ],
    // Provide the entity data reference for direct updates
    entityData: entityHook.entity.data as Project
  });
  
  /**
   * Update project client by ID - load client details and update fields directly
   * This is now a wrapper around the standardized handleLookupChange
   */
  const updateProjectClient = useCallback(async (clientId: string): Promise<Project | null> => {
    if (!entityHook.entity.data) return null;
    
    // Use the standardized lookup change handler
    const success = await formHook.handleLookupChange('clientGuid', clientId);
    
    if (success) {
      return entityHook.entity.data;
    }
    
    return null;
  }, [entityHook.entity.data, formHook]);
  
  /**
   * Update client fields directly in the form to prevent flickering
   */
  const updateClientFields = useCallback(async (clientId: string): Promise<boolean> => {
    // This function is now handled within updateProjectClient
    return await updateProjectClient(clientId).then(result => !!result);
  }, [updateProjectClient]);
  
  /**
   * Handle client selection change event in the form
   * @param e The selection change event object
   */
  const handleClientSelectionChange = useCallback((e: any) => {
    // Get selected clientId from the event value
    const clientId = e.value;
    
    // Use the standardized lookup change handler
    formHook.handleLookupChange('clientGuid', clientId).catch(error => {
      console.error('Error handling client selection change:', error);
    });
  }, [formHook]);
  
  return {
    ...entityHook,
    ...formHook,
    clients: clients || [],
    isClientLoading,
    handleClientSelectionChange,
    updateProjectClient,
    updateClientFields
  };
};
