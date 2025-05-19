import React, { createContext, useContext, useReducer, useCallback, useMemo, useRef, useEffect, ReactNode } from 'react';
import { ProjectProfileContextType } from './project-profile-types';
import { projectProfileReducer, initialProjectProfileState } from './project-profile-reducer';
import { Project } from '../../types/index';
import { useAuth } from '../auth';
import { useNavigation } from '../navigation';
// We don't directly import useProjects as it requires ProjectsProvider
import { fetchProject, updateProject } from '../../adapters/project.adapter';
import { getClientDetails } from '../../adapters/client.adapter';
import { useQueryClient } from '@tanstack/react-query';
import notify from 'devextreme/ui/notify';
import { useClientDataProvider } from '../../hooks/data-providers/useClientDataProvider';

// Create the context
const ProjectProfileContext = createContext<ProjectProfileContextType | undefined>(undefined);

interface ProjectProfileProviderProps {
  children: ReactNode;
  projectId?: string;
}

export function ProjectProfileProvider({ children, projectId }: ProjectProfileProviderProps) {
  const [state, dispatch] = useReducer(projectProfileReducer, initialProjectProfileState);
  const { user } = useAuth();
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

  // Extract project from state
  const { project } = state;

  // Load project data from the server and reset state when projectId changes
  useEffect(() => {
    // Reset editing state when projectId changes
    if (isMountedRef.current) {
      dispatch({ type: 'SET_EDITING', payload: false });
      dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
    }
    
    const loadProject = async () => {
      if (!projectId || !user?.token) {
        // If no project ID or token, immediately set loading to false to avoid indefinite loading state
        if (isMountedRef.current) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        return;
      }
      
      // Set loading state immediately - important to prevent premature rendering
      if (isMountedRef.current) {
        dispatch({ type: 'SET_LOADING', payload: true });
      }
      
      try {
        // Token is now handled by MSAL internally
        const projectData = await fetchProject(projectId);
        
        // After loading the project, also load the client details if a client is selected
        if (projectData && projectData.clientGuid && isMountedRef.current) {
          try {
    
            // Token is now handled by MSAL internally
            const clientData = await getClientDetails(projectData.clientGuid);
    
            
            // Check if we have the data we need
            if (clientData) {
              // Use nested structure for client data to match the form structure
              // This mirrors the pattern in useProjectEntityController
              projectData.client = {
                ...clientData
              };
              
              // Also keep the flat fields for backward compatibility
              projectData.clientName = clientData.description || '';
              
    
            } else {
    
            }
          } catch (clientError) {
    
            // Continue with project load even if client details fail
          }
        } else {
    
        }
        
        // Give client data a chance to be fully loaded before updating state
        // This helps ensure all data is available when the form renders
        if (isMountedRef.current) {
    
          dispatch({ type: 'SET_PROJECT', payload: { ...projectData } });  // Clone to ensure new reference
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        if (isMountedRef.current) {
          dispatch({ type: 'SET_ERROR', payload: error });
          dispatch({ type: 'SET_LOADING', payload: false });
          notify('Error loading project', 'error', 3000);
        }
      }
    };
    
    loadProject();
  }, [projectId, user?.token]);

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
  
  const saveProject = useCallback(async (project: Project) => {
    if (!user?.token || !project) return null;
    
    // Basic validation - we're implementing this directly instead of using ProjectsContext
    // to avoid the dependency on ProjectsProvider
    if (!project.name || !project.projectNumber) {
      if (isMountedRef.current) {
        dispatch({ 
          type: 'SET_VALIDATION_ERRORS', 
          payload: {
            name: project.name ? [] : ['Project name is required'],
            projectNumber: project.projectNumber ? [] : ['Project number is required']
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
        guid: project.guid,
        name: project.name,
        projectNumber: project.projectNumber,
        projectStatus: project.projectStatus,
        clientGuid: project.clientGuid,
        progressStart: project.progressStart,
        purchaseOrderNumber: project.purchaseOrderNumber
        // Audit fields (created, updated, etc.) are managed by the server
      };
      
      // Token is now handled by MSAL internally
      const updatedProject = await updateProject(project.guid, projectToSave);
      
      if (isMountedRef.current) {
        dispatch({ type: 'SET_PROJECT', payload: updatedProject });
        dispatch({ type: 'SET_SAVING', payload: false });
        dispatch({ type: 'SET_EDITING', payload: false });
        
        // Update navigation to reflect changes
        if (refreshNavigation) setTimeout(() => refreshNavigation(), 100);
        
        // Invalidate any queries that might depend on this project
        queryClient.invalidateQueries({ queryKey: ['project', project.guid] });
        
        notify('Project saved successfully', 'success', 3000);
      }
      
      return updatedProject;
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_ERROR', payload: error });
        dispatch({ type: 'SET_SAVING', payload: false });
        notify('Error saving project', 'error', 3000);
      }
      return null;
    }
  }, [user?.token, refreshNavigation, queryClient]);



  // Client operations
  const handleClientSelectionChange = useCallback(async (e: any) => {
    const clientId = e.value;
    if (!clientId || !formRef.current?.instance) return;
    
    try {
      const clientData = await getClientDetails(clientId);
      
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
  }, [project, user?.token]);
  
  const updateProjectClient = useCallback(async (clientId: string) => {
    if (!clientId || !user?.token || !formRef.current?.instance) return null;
    
    try {
      const clientData = await getClientDetails(clientId);
      
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
  }, [project, user?.token]);

  // Create the context value with proper memoization
  const contextValue = useMemo(() => ({
    state,
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
    validateProject
  }), [
    state,
    clients,
    isClientLoading,
    formRef,
    setFormRef,
    startEditing,
    cancelEditing,
    saveProject,
    handleClientSelectionChange,
    updateProjectClient,
    validateProject
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
