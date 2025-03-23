import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import './progress.scss';

// Import custom hooks from shared location
import { useProjectInfo } from '../../hooks/useProjectInfo';
import { useDeliverableGates } from '../../hooks/useDeliverableGates';
import { useProgressHandlers } from './progress.handlers';

// Import components from shared location
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import ScrollToTop from '../../components/scroll-to-top';
import LoadPanel from 'devextreme-react/load-panel';
import Button from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';
import ScrollView from 'devextreme-react/scroll-view';

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
  
  // Ref for the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    handleRowValidating,
    handleSaving
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
      setSelectedPeriod(prevPeriod => {
        if (!increment && (prevPeriod === null || prevPeriod <= 0)) {
          // Don't allow decrements below 0
          return 0;
        }
        return prevPeriod !== null ? prevPeriod + (increment ? 1 : -1) : null;
      });
    }
  };

  // Check if any data is still loading
  const isLoading = isLoadingProject || isLoadingGates;

  return (
    <div className="progress-container" ref={containerRef}>
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
                    <div className="period-stepper">
                      <Button
                        icon="spindown"
                        onClick={() => handlePeriodChange(false)}
                        stylingMode="outlined"
                        className="period-button down-button"
                      />
                      <NumberBox
                        value={selectedPeriod || 0}
                        min={0}
                        showSpinButtons={false}
                        onKeyDown={(e) => {
                          // Allow keyboard navigation (up/down arrows)
                          if (e.event && e.event.key === 'ArrowUp') {
                            handlePeriodChange(true);
                            e.event.preventDefault();
                          } else if (e.event && e.event.key === 'ArrowDown') {
                            handlePeriodChange(false);
                            e.event.preventDefault();
                          }
                        }}
                        onValueChanged={(e) => {
                          // Handle direct input
                          if (e.event && e.event.type === 'change') {
                            if (e.value !== null && e.value !== undefined) {
                              setSelectedPeriod(parseInt(e.value.toString(), 10));
                            }
                          }
                        }}
                        className="period-number-box"
                        width={60}
                        stylingMode="filled"
                      />
                      <Button
                        icon="spinup"
                        onClick={() => handlePeriodChange(true)}
                        stylingMode="outlined"
                        className="period-button up-button"
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
            onSaving={handleSaving}
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
