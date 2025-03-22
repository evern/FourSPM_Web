import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import './progress.scss';

// Import custom hooks from shared location
import { useProjectInfo } from '../../hooks/useProjectInfo';
import { useDeliverableGates } from '../../hooks/useDeliverableGates';
import { useProgressHandlers } from '../../hooks/useProgressHandlers';

// Import components from shared location
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import LoadPanel from 'devextreme-react/load-panel';

// Import types from shared location
import { API_CONFIG } from '../../config/api';
import { createProgressColumns } from './progress-columns';

// URL params
interface ProgressParams {
  projectId: string;
}

const Progress: React.FC = () => {
  // Extract project ID from URL params
  const { projectId } = useParams<ProgressParams>();
  const { user } = useAuth();
  
  // Fetch project information
  const { 
    project, 
    currentPeriod, 
    isLoading: isLoadingProject 
  } = useProjectInfo(projectId, user?.token);
  
  // Fetch deliverable gates
  const { 
    deliverableGates,
    isLoadingGates
  } = useDeliverableGates(user?.token);

  // Set up row updating and validation handlers
  const { 
    handleRowUpdating, 
    handleRowValidating 
  } = useProgressHandlers(deliverableGates, currentPeriod, user?.token);
  
  // Debug logs to help troubleshoot API issues
  console.log('Progress Component - Initial Render:', {
    projectId,
    hasToken: !!user?.token,
    isLoadingGates
  });

  // Check if any data is still loading
  const isLoading = isLoadingProject || isLoadingGates;

  return (
    <div className="progress-container">
      {/* Show loading indicator when data is being fetched */}
      <LoadPanel 
        visible={isLoading} 
        position={{ of: '.progress-container' }}
        showIndicator={true}
        showPane={true}
      />
      
      {/* Only render grid when data is loaded */}
      {!isLoading && (
        <div className="custom-grid-wrapper">
          <div className="grid-custom-title">
            {project ? `${project.projectNumber} - ${project.name} Progress Tracking` : 'Progress Tracking'}
          </div>
          {/* Project header with period info */}
          {project && (
            <div className="period-selector">
              <div className="period-details">
                <div className="period-info">
                  <span>Reporting Period: </span>
                  <strong>{currentPeriod}</strong>
                  <span className="secondary-info"> (weeks from project start)</span>
                </div>
                <div className="period-date">
                  <span>Current Date: </span>
                  <strong>{new Date().toLocaleDateString()}</strong>
                </div>
                <div className="project-start-date">
                  <span>Project Start Date: </span>
                  <strong>
                    {project.progressStart
                      ? `${new Date(project.progressStart).toLocaleDateString()}`
                      : 'Not set'}
                  </strong>
                  {project.progressStart && (
                    <span className="secondary-info"> ({new Date(project.progressStart).toLocaleString('en-US', {weekday: 'long'})})</span>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Progress tracking grid - using the ODataGrid component */}
          <ODataGrid
            title=" "
            endpoint={`${API_CONFIG.baseUrl}/odata/v1/Deliverables/GetWithProgressPercentages?projectGuid=${projectId}&period=${currentPeriod}`}
            columns={createProgressColumns()}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onRowValidating={handleRowValidating}
            allowUpdating={true}
            allowAdding={false}
            allowDeleting={false}
          />
        </div>
      )}
    </div>
  );
};

export default Progress;
