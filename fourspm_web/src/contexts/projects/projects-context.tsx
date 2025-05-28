import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { ProjectsContextType } from './projects-types';
import { projectsReducer, initialProjectsState } from './projects-reducer';
import { Project } from '../../types/index';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';

import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { useEntityValidator } from '../../hooks/utils/useEntityValidator';
import { useClientDataProvider } from '../../hooks/data-providers/useClientDataProvider';
import { useAutoIncrement } from '../../hooks/utils/useAutoIncrement';


export const PROJECT_VALIDATION_RULES: ValidationRule[] = [
  { field: 'projectNumber', required: true, maxLength: 50, errorText: 'Project Number is required' },
  { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
  { field: 'projectStatus', required: true, errorText: 'Project Status is required' },
  { field: 'clientGuid', required: true, errorText: 'Client is required' }
];


const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

interface ProjectsProviderProps {
  children: ReactNode;
}

export function ProjectsProvider({ children }: ProjectsProviderProps) {
  const [state, dispatch] = useReducer(projectsReducer, initialProjectsState);
  

  const isMountedRef = React.useRef(true);
  

  

  const { clientsStore, isLoading: clientsLoading } = useClientDataProvider();

  const clientDataLoaded = !clientsLoading;
  

  const { nextNumber: nextProjectNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: PROJECTS_ENDPOINT,
    field: 'projectNumber',
    padLength: 2,
    startFrom: '01'
  });
  
  React.useEffect(() => {

    isMountedRef.current = true;
    

    return () => {
      isMountedRef.current = false;
    };
  }, []);
  

  

  const { validateEntity } = useEntityValidator({
    validationRules: PROJECT_VALIDATION_RULES,
  });
  

  const validateProject = useCallback((project: Project, rules: ValidationRule[] = PROJECT_VALIDATION_RULES) => {
    if (!isMountedRef.current) return false;
    

    const validationResult = validateEntity(project);
    

    const errors: Record<string, string[]> = {};
    Object.entries(validationResult.errors).forEach(([key, value]) => {
      errors[key] = [value];
    });
    

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
  

  const generateProjectId = useCallback(() => {
    return uuidv4();
  }, []);
  

  const setProjectDefaults = useCallback((project: Partial<Project>, nextProjectNumber?: string) => {
    return {
      ...project,
      guid: project.guid || generateProjectId(),
      projectNumber: project.projectNumber || nextProjectNumber || '',
      projectStatus: project.projectStatus || 'TenderInProgress'
    } as Project;
  }, [generateProjectId]);
  

  const contextValue = useMemo(() => ({

    state,
    

    validateProject,
    generateProjectId,
    setProjectDefaults,
    

    clientDataSource: clientsStore,
    clientDataLoaded,
    

    nextProjectNumber,
    refreshNextNumber
  }), [
    state,
    validateProject,
    generateProjectId,
    setProjectDefaults,
    clientsStore,
    clientDataLoaded,
    nextProjectNumber,
    refreshNextNumber
  ]);
  
  return (
    <ProjectsContext.Provider value={contextValue}>
      {children}
    </ProjectsContext.Provider>
  );
}


export function useProjects(): ProjectsContextType {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
