import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { ProjectsContextType, ProjectsState, ProjectsAction } from './projects-types';
import { projectsReducer, initialProjectsState } from './projects-reducer';
import { Project } from '../../types/index';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../auth';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { useEntityValidator } from '../../hooks/utils/useEntityValidator';

/**
 * Default validation rules for projects
 */
export const PROJECT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'projectNumber', required: true, maxLength: 50, errorText: 'Project Number is required' },
  { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
  { field: 'projectStatus', required: true, errorText: 'Project Status is required' },
  { field: 'clientGuid', required: true, errorText: 'Client is required' }
];

// Create the context with a default undefined value
const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

interface ProjectsProviderProps {
  children: ReactNode;
}

export function ProjectsProvider({ children }: ProjectsProviderProps) {
  const [state, dispatch] = useReducer(projectsReducer, initialProjectsState);
  const { user } = useAuth();
  
  // CRITICAL: Track the component mount state to prevent state updates after unmounting
  const isMountedRef = React.useRef(true);
  
  React.useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;
    
    // Clean up function to prevent state updates after unmounting
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // CRUD operations are now handled directly by ODataGrid
  // The context now focuses only on validation and maintaining state
  
  // deleteProject function removed as ODataGrid now handles deletion directly
  
  // Use the entity validator for project validation
  const { validateEntity } = useEntityValidator({
    validationRules: PROJECT_VALIDATION_RULES,
  });
  
  // Validate project - enhanced with proper rules
  const validateProject = useCallback((project: Project, rules: ValidationRule[] = PROJECT_VALIDATION_RULES) => {
    if (!isMountedRef.current) return false;
    
    // Use the entity validator to validate the project
    const validationResult = validateEntity(project);
    
    // Format errors for the state
    const errors: Record<string, string[]> = {};
    Object.entries(validationResult.errors).forEach(([key, value]) => {
      errors[key] = [value];
    });
    
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
  }, [validateEntity]);
  
  // Generate a new UUID for a project
  const generateProjectId = useCallback(() => {
    return uuidv4();
  }, []);
  
  // Set default values for a new project
  const setProjectDefaults = useCallback((project: Partial<Project>, nextProjectNumber?: string) => {
    return {
      ...project,
      guid: project.guid || generateProjectId(),
      projectNumber: project.projectNumber || nextProjectNumber || '',
      projectStatus: project.projectStatus || 'TenderInProgress'
    } as Project;
  }, [generateProjectId]);
  
  // CRITICAL: Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    validateProject,
    generateProjectId,
    setProjectDefaults
  }), [
    state, 
    validateProject,
    generateProjectId,
    setProjectDefaults
  ]);
  
  return (
    <ProjectsContext.Provider value={contextValue}>
      {children}
    </ProjectsContext.Provider>
  );
}

// Custom hook to use the projects context
export function useProjects(): ProjectsContextType {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
