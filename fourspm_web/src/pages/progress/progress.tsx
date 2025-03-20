import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { useAuth } from '../../contexts/auth';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import './progress.scss';

// Import progress columns
import { progressColumns } from './progress-columns';
import { handleProgressUpdate } from './progress-store';

interface ProgressParams {
  projectId: string;
}

interface ProjectInfo {
  projectNumber: string;
  name: string;
  progressStart: Date;
}

const Progress: React.FC = () => {
  const { projectId } = useParams<ProgressParams>();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<number>(1);

  // Debug logs to help troubleshoot API issues
  console.log('Progress Component - Initial Render:', {
    projectId,
    hasToken: !!user?.token
  });

  // Fetch project info when component mounts
  useEffect(() => {
    const fetchProjectInfo = async () => {
      if (!user?.token || !projectId) return;
      
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects(${projectId})`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Set project information
          const projectInfo = {
            projectNumber: data.projectNumber || '',
            name: data.name || '',
            progressStart: data.progressStart ? new Date(data.progressStart) : new Date()
          };
          
          setProject(projectInfo);
          
          // Calculate current reporting period based on project start date
          if (projectInfo.progressStart) {
            const period = calculateCurrentPeriod(projectInfo.progressStart);
            setCurrentPeriod(period);
            console.log(`Current reporting period: ${period}`);
          }
        } else {
          console.error('Failed to fetch project info:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching project info:', error);
      }
    };
    
    fetchProjectInfo();
  }, [projectId, user?.token]);

  const calculateCurrentPeriod = (projectStartDate: Date): number => {
    const start = new Date(projectStartDate);
    const today = new Date();
    
    // Calculate the number of months between the start date and today
    const months = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth();
    // Add 1 since periods are 1-based, not 0-based
    return months + 1;
  };

  // Handle row updating event to manage progress updates
  const handleRowUpdating = (e: any) => {
    console.log('Row updating:', e);
    
    // Check if we're updating totalPercentageEarnt
    if (e.newData.totalPercentageEarnt !== undefined) {
      // Make sure the value is in the correct range (0-1)
      let percentValue = e.newData.totalPercentageEarnt;
      
      // If value is greater than 1, assume it's been entered as a percentage (0-100) and convert
      if (percentValue > 1) {
        percentValue = percentValue / 100;
      }
      
      // Clamp value between 0 and 1
      percentValue = Math.max(0, Math.min(1, percentValue));
      
      // Update the newData with the corrected value
      e.newData.totalPercentageEarnt = percentValue;
      
      // Get the deliverable key
      const deliverableKey = e.key;
      
      // Use custom handler for progress updates
      const result = handleProgressUpdate(deliverableKey, e.newData, currentPeriod, e.oldData);
      
      // Returning a Promise will make DevExtreme wait for it to resolve
      e.cancel = true;
      return result.then(() => {
        // Manually reload the grid after update
        if (e.component) {
          // Refresh the grid to update data
          e.component.refresh();
          
          // Exit edit mode explicitly
          e.component.cancelEditData();
        }
      });
    }
    
    // For other fields, let default handler work
    return true;
  };

  return (
    <div className="progress-container">
      <div className="period-selector">
        <div className="period-info">
          <span>Reporting Period: </span>
          <strong>{currentPeriod}</strong>
        </div>
        <div className="period-date">
          <span>As of: </span>
          <strong>{new Date().toLocaleDateString()}</strong>
        </div>
      </div>
      
      <div className="grid-container">
        <h2 className="grid-title">{project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables'}</h2>
        
        <ODataGrid
          title=""
          endpoint={`${API_CONFIG.baseUrl}/odata/v1/Deliverables`}
          columns={progressColumns}
          keyField="guid"
          defaultFilter={[["projectGuid", "=", projectId]]}
          allowAdding={false}
          allowDeleting={false}
          allowUpdating={true}
          onRowUpdating={handleRowUpdating}
        />
      </div>
    </div>
  );
};

export default Progress;
