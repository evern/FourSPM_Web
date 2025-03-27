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
  projectId?: string,
  userToken?: string
): Promise<Project> => {
  if (!projectId || !userToken) throw new Error('Missing required parameters');
  return fetchProject(projectId, userToken);
};

/**
 * Checks if the required parameters are present
 */
const hasRequiredParams = (
  projectId?: string,
  userToken?: string
): boolean => {
  return !!projectId && !!userToken;
};

/**
 * Create the base hook using the factory
 */
const useBaseProjectInfo = createDataFetchingHook<Project, [string?, string?]>(
  fetchProjectWithOptionalParams,
  hasRequiredParams
);

/**
 * Hook for fetching project information (read-only)
 * Use this hook when you only need to read project data and don't need to update it
 * 
 * @param projectId The project GUID to fetch information for
 * @param userToken The user's authentication token
 * @returns Object containing project information and loading state
 */
export const useProjectInfo = (
  projectId: string | undefined,
  userToken: string | undefined
): ProjectInfoResult => {
  const { data: project, isLoading, error } = useBaseProjectInfo(projectId, userToken);
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
