import { useState, useEffect } from 'react';
import { ProjectInfo } from '../types/project';
import { fetchProject } from '../services/project.service';
import { calculateCurrentPeriod } from '../utils/period-utils';

/**
 * Hook to fetch and provide project information and current reporting period
 * @param projectId The project GUID to fetch information for
 * @param userToken The user's authentication token
 * @returns Object containing project info, current period, loading state, and error state
 */
export const useProjectInfo = (projectId: string | undefined, userToken: string | undefined) => {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!userToken || !projectId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const projectInfo = await fetchProject(projectId, userToken);
        setProject(projectInfo);
        
        // Calculate current reporting period based on project start date
        if (projectInfo.progressStart) {
          const period = calculateCurrentPeriod(projectInfo.progressStart);
          setCurrentPeriod(period);
          console.log(`Current reporting period: ${period}`);
        }
      } catch (error: any) {
        setError(`Error fetching project info: ${error.message}`);
        console.error('Error fetching project info:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectInfo();
  }, [projectId, userToken]);

  return { project, currentPeriod, isLoading, error };
};
