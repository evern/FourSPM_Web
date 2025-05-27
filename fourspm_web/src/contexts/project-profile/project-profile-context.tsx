import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { ProjectProfileContextType } from './project-profile-types';
import { projectProfileReducer, initialProjectProfileState } from './project-profile-reducer';
import { Project } from '../../types/index';
import { getToken } from '../../utils/token-store';
import { useNavigation } from '../navigation';
import { fetchProject, updateProject } from '../../adapters/project.adapter';
import { getClientDetails } from '../../adapters/client.adapter';
import { useQueryClient } from '@tanstack/react-query';
import notify from 'devextreme/ui/notify';
import { useClientDataProvider } from '../../hooks/data-providers/useClientDataProvider';
import { errorHandler } from '../../components/error-handler';

// Create the context
const ProjectProfileContext = createContext<ProjectProfileContextType | undefined>(undefined);

interface ProjectProfileProviderProps {
  children: ReactNode;
  projectId?: string;
}

export function ProjectProfileProvider({ children, projectId }: ProjectProfileProviderProps) {
  const [state, dispatch] = useReducer(projectProfileReducer, initialProjectProfileState);
  // Extract project from state for convenience
  const { project } = state;
  const { refreshNavigation } = useNavigation();
  const queryClient = useQueryClient();
  
  // Form reference for DevExtreme form
  const formRef = useRef<any>(null);
  const setFormRef = useCallback((ref: any) => {
    formRef.current = ref;
  }, []);
  
  // Track component mount state to prevent state updates after unmounting
  const isMountedRef = useRef(true);
  
  // Use the client data provider hook - matching the original pattern in useProjectEntityController
  const { clients, isLoading: isClientLoading } = useClientDataProvider();
  
  // Implement a local project validation function instead of using useProjects
  const validateProject = useCallback((project: Project) => {
    if (!project) return false;
    
    const errors: Record<string, string[]> = {};
    
    // Basic validation rules
    if (!project.name) {
      errors.name = ['Project name is required'];
    }
    
    if (!project.projectNumber) {
      errors.projectNumber = ['Project number is required'];
    }
    
    if (!project.projectStatus) {
      errors.projectStatus = ['Project status is required'];
    }
    
    if (!project.clientGuid) {
      errors.clientGuid = ['Client is required'];
    }
    
    // Update validation errors state
    if (Object.keys(errors).length > 0) {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
      }
      return false;
    } else {
      if (isMountedRef.current) {
        dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
      }
      return true;
    }
  }, []);
  
  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;
    
    // Clean up function to prevent state updates after unmounting
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  /**
   * Load project data from the server
   * Using Optimized Direct Access pattern for token handling
   */
  const loadProject = useCallback(async () => {
    if (!projectId) return;
    
    try {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }
      
      // Get token directly at the leaf level when needed (Optimized Direct Access pattern)
      const token = getToken();
      if (!token) {
        notify('Authentication token is required', 'error', 3000);
        if (isMountedRef.current) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }
      
      // Fetch project data using direct token access
      const fetchToken = getToken(); // Get fresh token at point of use
      if (!fetchToken) {
        throw new Error('Authentication token is required');
      }
      const projectData = await fetchProject(projectId, fetchToken);
        
      // After loading the project, also load the client details if a client is selected
      if (projectData && projectData.clientGuid && isMountedRef.current) {
        try {
          // Get token directly at the leaf level when needed (Optimized Direct Access pattern)
          const clientToken = getToken();
          if (!clientToken) {
            throw new Error('Authentication token is required');
          }
          const clientData = await getClientDetails(projectData.clientGuid, clientToken);
          
          // Check if we have the data we need
          if (clientData) {
            // Use nested structure for client data to match the form structure
            // This mirrors the pattern in useProjectEntityController
            projectData.client = {
              ...clientData
            };
            
            // Also keep the flat fields for backward compatibility
            projectData.clientName = clientData.description || '';
            
          }
        } catch (clientError) {
          // Continue with project load even if client details fail
        }
      }
      
      // Give client data a chance to be fully loaded before updating state
      // This helps ensure all data is available when the form renders
      if (isMountedRef.current) {
        dispatch({ type: 'SET_PROJECT', payload: { ...projectData } });  // Clone to ensure new reference
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      if (isMountedRef.current) {
        // Check if it's a 403/Forbidden error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isForbiddenError = 
          errorMessage.includes('403') || 
          errorMessage.includes('Forbidden') ||
          errorMessage.includes('not have permission');
        
        // Set loading to false immediately
        dispatch({ type: 'SET_LOADING', payload: false });
        
        if (isForbiddenError) {
          // For 403 errors, show a clear toast notification
          notify({
            message: 'You do not have permission to view this project',
            type: 'error',
            displayTime: 3500,
            position: { at: 'bottom center', my: 'bottom center', offset: '0 -20' },
            width: 'auto',
            // Use the standardized error styling from the error handler
            color: '#ffffff',
            backgroundColor: '#d9534f',
            borderColor: '#d43f3a'
          });
          
          // Don't set the error state for permission errors - just show the toast notification
          // This prevents the persistent global error banner
          dispatch({ type: 'SET_ERROR', payload: null })
        } else {
          // For other errors, set the error state (which might show the bottom bar)
          // and also show a toast notification
          dispatch({ type: 'SET_ERROR', payload: error });
          notify('Error loading project', 'error', 3000);
        }
      }
    }
  }, [projectId]);
  
  // Reset editing state and load project when projectId changes
  useEffect(() => {
    // Reset editing state when projectId changes
    if (isMountedRef.current) {
      dispatch({ type: 'SET_EDITING', payload: false });
      dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
    }
    
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  // Form operations
  const startEditing = useCallback(() => {
    if (isMountedRef.current) {
      dispatch({ type: 'SET_EDITING', payload: true });
    }
  }, []);
  
  const cancelEditing = useCallback(() => {
    if (isMountedRef.current) {
      // Exit edit mode first
      dispatch({ type: 'SET_EDITING', payload: false });
      
      // If we have an original project, reset the current project to it
      if (state.originalProject) {
        dispatch({ type: 'SET_PROJECT', payload: state.originalProject });
      }
      
      // For DevExtreme Form, don't use resetValues() or updateData() - these can cause issues
      // with lookup fields. Simply let the parent component re-render with original data.
    }
  }, [state.originalProject]);
  
  const saveProject = useCallback(async (projectData: Project) => {
    if (!projectData) return null;
    
    // Get token directly using Optimized Direct Access pattern
    const token = getToken();
    if (!token) {
      notify('Authentication token is required', 'error', 3000);
      return null;
    }
    
    // Basic validation - we're implementing this directly instead of using ProjectsContext
    // to avoid the dependency on ProjectsProvider
    if (!validateProject(projectData)) {
      if (isMountedRef.current) {
        notify({
          message: 'Please correct validation errors',
          type: 'error',
          displayTime: 3000,
          position: {
            my: 'center top',
            at: 'center top'
          } 
        });
      }
      return null;
    }
    
    // Clear any previous validation errors
    if (isMountedRef.current) {
      dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
    }
    
    try {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_SAVING', payload: true });
      }
      
      // Clean up the project object to only include fields expected by the API
      // This removes client display fields that shouldn't be sent to the server
      const projectToSave = {
        guid: projectData.guid,
        name: projectData.name,
        projectNumber: projectData.projectNumber,
        projectStatus: projectData.projectStatus,
        clientGuid: projectData.clientGuid,
        progressStart: projectData.progressStart,
        purchaseOrderNumber: projectData.purchaseOrderNumber
      };

      const saveToken = getToken();
      if (!saveToken) {
        throw new Error('Authentication token is required for API requests');
      }
      const updatedProject = await updateProject(projectData.guid, projectToSave, saveToken);
      
      if (isMountedRef.current) {
        dispatch({ type: 'SET_PROJECT', payload: updatedProject });
        dispatch({ type: 'SET_SAVING', payload: false });
        dispatch({ type: 'SET_EDITING', payload: false });
        
        // Update navigation to reflect changes
        if (refreshNavigation) setTimeout(() => refreshNavigation(), 100);
        
        // Invalidate any queries that might depend on this project
        queryClient.invalidateQueries({ queryKey: ['project', projectData.guid] });
        
        notify('Project saved successfully', 'success', 3000);
      }
      
      return updatedProject;
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_ERROR', payload: error });
        dispatch({ type: 'SET_SAVING', payload: false });
        
        // Parse the error to provide more specific feedback
        let errorMessage = 'Error saving project';
        
        // Check if it's a permission error (HTTP 403)
        if (error instanceof Error) {
          console.error('Project save error details:', error);
          
          // For permission errors
          if (error.message.includes('403') || 
              error.message.toLowerCase().includes('forbidden') || 
              error.message.toLowerCase().includes('permission')) {
            errorMessage = 'You do not have permission to edit this project.';
          } 
          // For validation errors
          else if (error.message.includes('400') || error.message.toLowerCase().includes('validation')) {
            errorMessage = 'Project could not be saved due to validation errors. Please check your inputs.';
          }
          // For not found errors
          else if (error.message.includes('404') || error.message.toLowerCase().includes('not found')) {
            errorMessage = 'Project not found or may have been deleted.';
          }
          // For network errors
          else if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('connection')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          }
        }
        
        // Show the error notification with the specific message
        notify({
          message: errorMessage,
          type: 'error',
          displayTime: 5000,
          position: { at: 'top center', my: 'top center' },
          width: 'auto',
          closeOnClick: true,
          closeOnOutsideClick: true
        });
      }
      return null;
    }
  }, [refreshNavigation, queryClient, validateProject]);

  // Client operations
  const handleClientSelectionChange = useCallback(async (e: any) => {
    const clientId = e.value;
    if (!clientId || !formRef.current?.instance) return;
    
    // Get token directly using Optimized Direct Access pattern
    const token = getToken();
    if (!token) {
      notify('Authentication token is required', 'error', 3000);
      return;
    }
    
    try {
      // Get fresh token at point of use (Optimized Direct Access pattern)
      const clientToken = getToken();
      if (!clientToken) {
        throw new Error('Authentication token is required for API requests');
      }
      const clientData = await getClientDetails(clientId, clientToken);
      
      // Get form instance for updating
      const formInstance = formRef.current.instance;
      
      // Create client object with contact fields
      const clientWithContacts = {
        ...clientData
      };
      
      // Update with nested client structure
      formInstance.updateData('clientGuid', clientId);
      formInstance.updateData('clientName', clientData.description || '');
      formInstance.updateData('client', clientWithContacts);
      
      // Also update the project state to ensure consistency when saving
      if (project && isMountedRef.current) {
        const updatedProject = {
          ...project,
          clientGuid: clientId,
          clientName: clientData.description || '',
          client: clientWithContacts
        };
        
        dispatch({ type: 'SET_PROJECT', payload: updatedProject });
      }
    } catch (error) {
      notify('Error loading client details', 'error', 3000);
    }
  }, [project]);
  
  const updateProjectClient = useCallback(async (clientId: string) => {
    if (!clientId || !formRef.current?.instance) return null;
    
    // Get token directly using Optimized Direct Access pattern
    const token = getToken();
    if (!token) {
      notify('Authentication token is required', 'error', 3000);
      return null;
    }
    
    try {
      // Get fresh token at point of use (Optimized Direct Access pattern)
      const clientToken = getToken();
      if (!clientToken) {
        throw new Error('Authentication token is required for API requests');
      }
      const clientData = await getClientDetails(clientId, clientToken);
      
      if (!project) return null;
      
      // Create client object with contact fields
      const clientWithContacts = {
        ...clientData,
        clientContactName: clientData.contactName || '',
        clientContactEmail: clientData.contactEmail || '',
        clientContactNumber: clientData.contactNumber || ''
      };
      
      // Create updated project with nested client data
      const updatedProject: Project = {
        ...project,
        clientGuid: clientId,
        clientName: clientData.name || '',
        client: clientWithContacts
      };
      
      if (isMountedRef.current) {
        dispatch({ type: 'SET_PROJECT', payload: updatedProject });
      }
      
      return updatedProject;
    } catch (error) {
      notify('Error updating client details', 'error', 3000);
      return null;
    }
  }, [project]);

  // Create the context value with proper memoization
  const contextValue = useMemo(() => ({
    // State - token handled via Optimized Direct Access pattern
    state,
    
    // Token management now handled by direct getToken() access
    
    // Client data from useClientDataProvider - matching original implementation
    clients,
    isClientLoading,
    // Form references
    formRef,
    setFormRef,
    // Form operations
    startEditing,
    cancelEditing,
    saveProject,
    handleClientSelectionChange,
    updateProjectClient,
    validateProject,
    // Add loadProject to allow manual refresh
    loadProject
  }), [
    state,
    // Token removed from dependencies - Optimized Direct Access pattern
    clients,
    isClientLoading,
    formRef,
    setFormRef,
    startEditing,
    cancelEditing,
    saveProject,
    handleClientSelectionChange,
    updateProjectClient,
    validateProject,
    loadProject
  ]);
  
  return (
    <ProjectProfileContext.Provider value={contextValue}>
      {children}
    </ProjectProfileContext.Provider>
  );
}

// Custom hook to use the project profile context
export function useProjectProfile(): ProjectProfileContextType {
  const context = useContext(ProjectProfileContext);
  if (context === undefined) {
    throw new Error('useProjectProfile must be used within a ProjectProfileProvider');
  }
  return context;
}
