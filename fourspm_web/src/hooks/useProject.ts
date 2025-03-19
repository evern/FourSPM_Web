import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/auth';

interface Project {
  id: string;
  name: string;
  progressStart: string;
  // Add other project properties as needed
}

const useProject = (projectId: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setProject(null);
        setLoading(false);
        return;
      }

      try {
        // Make the request without authentication for now
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/odata/projects/${projectId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch project');
        }

        const data = await response.json();
        setProject(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
};

export default useProject;
