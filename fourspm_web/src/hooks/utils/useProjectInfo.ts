import { useState, useEffect } from 'react';
import { Project } from '../../types/odata-types';
import { fetchProject } from '../../adapters/project.adapter';
import { calculateCurrentPeriod } from '../../utils/period-utils';
import { createDataFetchingHook, DataFetchingResult } from '../factories/createDataFetchingHook';

/**
 * Interface for project info hook result
 */
export interface ProjectInfoResult extends Omit<DataFetchingResult<Project>, 'data'> {
  project: Project | null;
  currentPeriod: number | null;
}

/**
 * Wrapper for fetchProject that handles optional parameters
 */
const fetchProjectWithOptionalParams = async (
  projectId?: string
): Promise<Project> => {
  if (!projectId) throw new Error('Missing project ID parameter');
  // Token is now handled by MSAL internally
  return fetchProject(projectId);
};

/**
 * Checks if the required parameters are present
 */
const hasRequiredParams = (
  projectId?: string
): boolean => {
  return !!projectId;
};

/**
 * Create the base hook using the factory
 */
const useBaseProjectInfo = createDataFetchingHook<Project, [string?]>(
  fetchProjectWithOptionalParams,
  hasRequiredParams
);

/**
 * Hook for fetching project information (read-only)
 * Use this hook when you only need to read project data and don't need to update it
 * 
 * @param projectId The project GUID to fetch information for
 * @returns Object containing project information and loading state
 */
export const useProjectInfo = (
  projectId: string | undefined
): ProjectInfoResult => {
  // Token is now handled by MSAL internally
  const { data: project, isLoading, error } = useBaseProjectInfo(projectId);
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
  
  // Calculate the current period whenever project data changes
  useEffect(() => {
    if (project?.progressStart) {
      const period = calculateCurrentPeriod(new Date(project.progressStart));
      setCurrentPeriod(period);
    }
  }, [project]);
  
  return {
    project,
    currentPeriod,
    isLoading,
    error
  };
};
