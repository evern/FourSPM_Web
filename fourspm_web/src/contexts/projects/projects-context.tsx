import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import { ProjectsContextType, ProjectsState, ProjectsAction } from './projects-types';
import { projectsReducer, initialProjectsState } from './projects-reducer';
import { Project } from '../../types/index';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../auth';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';

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
  
  // Validate project
  const validateProject = useCallback((project: Project, rules: ValidationRule[] = []) => {
    if (!isMountedRef.current) return false;
    
    const errors: Record<string, string[]> = {};
    
    // Process each validation rule
    rules.forEach(rule => {
      const fieldValue = project[rule.field as keyof Project];
      
      if (rule.required && (!fieldValue || fieldValue === '')) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} is required`);
      }
      
      if (rule.maxLength && typeof fieldValue === 'string' && fieldValue.length > rule.maxLength) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} must be at most ${rule.maxLength} characters`);
      }
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
  }, []);
  
  // CRITICAL: Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    validateProject
  }), [
    state, 
    validateProject
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
