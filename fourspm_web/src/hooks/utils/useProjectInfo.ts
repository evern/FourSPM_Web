import { useState, useEffect } from 'react';
import { Project } from '../../types/odata-types';
import { fetchProject } from '../../adapters/project.adapter';
import { calculateCurrentPeriod } from '../../utils/period-utils';
import { createDataFetchingHook, DataFetchingResult } from '../factories/createDataFetchingHook';
import { useToken } from '../../contexts/token-context';

/**
 * Interface for project info hook result
 */
export interface ProjectInfoResult extends Omit<DataFetchingResult<Project>, 'data'> {
  project: Project | null;
  currentPeriod: number | null;
}

// No wrapper functions needed - we'll handle everything inside the hook

/**
 * Hook for fetching project information (read-only)
 * Use this hook when you only need to read project data and don't need to update it
 * 
 * @param projectId The project GUID to fetch information for
 * @param options Configuration options for the hook
 * @returns Object containing project information and loading state
 */
export const useProjectInfo = (
  projectId: string | undefined,
  options: { expandClient?: boolean } = {}
): ProjectInfoResult => {
  // Set default options
  const { expandClient = true } = options;
  // Get token from the token acquisition hook
  const { token } = useToken();
  
  // State for project data
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
  
  // Fetch project data whenever projectId or token changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!projectId) {
        if (isMounted) {
          setError(new Error('Missing project ID parameter'));
        }
        return;
      }
      
      if (!token) {
        if (isMounted) {
          setError(new Error('Authentication token is required for API requests'));
        }
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await fetchProject(projectId, token, expandClient);
        
        if (isMounted) {
          setProject(data);
          setError(null);
          
          // Calculate current period
          if (data?.progressStart) {
            const period = calculateCurrentPeriod(new Date(data.progressStart));
            setCurrentPeriod(period);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch project'));
          setProject(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [projectId, token]);
  
  return {
    project,
    currentPeriod,
    isLoading,
    error
  };
};
