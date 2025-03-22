import React, { useState, useEffect } from 'react';
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
import Button from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';

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
    currentPeriod: initialPeriod, 
    isLoading: isLoadingProject 
  } = useProjectInfo(projectId, user?.token);
  
  // State for user-selected period and calculated progress date
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [progressDate, setProgressDate] = useState<Date>(new Date());
  
  // Initialize selectedPeriod once initialPeriod is available
  useEffect(() => {
    if (initialPeriod !== null && selectedPeriod === null) {
      setSelectedPeriod(initialPeriod);
    }
  }, [initialPeriod, selectedPeriod]);
  
  // Calculate progress date whenever period or project start date changes
  useEffect(() => {
    if (project?.progressStart && selectedPeriod !== null) {
      const startDate = new Date(project.progressStart);
      const newProgressDate = new Date(startDate);
      newProgressDate.setDate(startDate.getDate() + (selectedPeriod * 7)); // Add weeks
      setProgressDate(newProgressDate);
    }
  }, [selectedPeriod, project?.progressStart]);
  
  // Fetch deliverable gates
  const { 
    deliverableGates,
    isLoadingGates
  } = useDeliverableGates(user?.token);

  // Set up row updating and validation handlers
  const { 
    handleRowUpdating, 
    handleRowValidating 
  } = useProgressHandlers(deliverableGates, selectedPeriod ?? initialPeriod ?? 0, user?.token);
  
  // Debug logs to help troubleshoot API issues
  console.log('Progress Component - Initial Render:', {
    projectId,
    hasToken: !!user?.token,
    isLoadingGates
  });

  // Handle period increment/decrement
  const handlePeriodChange = (increment: boolean) => {
    if (selectedPeriod !== null) {
      setSelectedPeriod(prevPeriod => (prevPeriod !== null ? prevPeriod + (increment ? 1 : -1) : null));
    }
  };

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
                  <div className="info-item">
                    <span>Reporting Period:</span>
                    <div className="number-box-container">
                      <NumberBox
                        value={selectedPeriod || 0}
                        min={0}
                        showSpinButtons={true}
                        useLargeSpinButtons={true}
                        onValueChanged={(e) => {
                          if (e.value !== null && e.value !== undefined) {
                            const currentPeriod = selectedPeriod || 0;
                            const isIncrement = e.value > currentPeriod;
                            handlePeriodChange(isIncrement);
                          }
                        }}
                        className="period-number-box"
                        width={100}
                        stylingMode="filled"
                      />
                    </div>
                    <span className="secondary-info">(weeks from project start)</span>
                  </div>
                  <div className="info-item">
                    <span>Progress Date:</span>
                    <strong>{progressDate.toLocaleDateString()}</strong>
                  </div>
                  <div className="info-item">
                    <span>Project Start Date:</span>
                    <strong>
                      {project.progressStart
                        ? new Date(project.progressStart).toLocaleDateString()
                        : 'Not set'}
                    </strong>
                    {project.progressStart && (
                      <span className="secondary-info">({new Date(project.progressStart).toLocaleString('en-US', {weekday: 'long'})})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Progress tracking grid - using the ODataGrid component */}
          <ODataGrid
            title=" "
            endpoint={`${API_CONFIG.baseUrl}/odata/v1/Deliverables/GetWithProgressPercentages?projectGuid=${projectId}&period=${selectedPeriod ?? initialPeriod ?? 0}`}
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
