import { useState, useEffect } from 'react';
import { Project } from '../../types/odata-types';
import { fetchProject } from '../../adapters/project.adapter';
import { calculateCurrentPeriod } from '../../utils/period-utils';
import { createDataFetchingHook, DataFetchingResult } from '../factories/createDataFetchingHook';
import { getToken } from '../../utils/token-store';


export interface ProjectInfoResult extends Omit<DataFetchingResult<Project>, 'data'> {
  project: Project | null;
  currentPeriod: number | null;
}




export const useProjectInfo = (
  projectId: string | undefined,
  options: { expandClient?: boolean } = {}
): ProjectInfoResult => {

  const { expandClient = true } = options;

  

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<number | null>(null);
  

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!projectId) {
        if (isMounted) {
          setError(new Error('Missing project ID parameter'));
        }
        return;
      }
      

      const token = getToken();
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
  }, [projectId]);
  
  return {
    project,
    currentPeriod,
    isLoading,
    error
  };
};
