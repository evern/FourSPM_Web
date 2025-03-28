import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import './deliverable-progress.scss';

// Import custom hooks from shared location
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import { useDeliverableProgressCollectionController } from '../../hooks/controllers/useDeliverableProgressCollectionController';
import { useDeliverableGateDataProvider } from '../../hooks/data-providers/useDeliverableGateDataProvider';
import { usePeriodManager } from '../../hooks/utils/usePeriodManager';
import { useScreenSizeClass } from '../../utils/media-query';

// Import components from shared location
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import LoadPanel from 'devextreme-react/load-panel';
import Button from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';
import { ScrollView } from 'devextreme-react/scroll-view';

// Import types and constants
import { createDeliverableProgressColumns } from './deliverable-progress-columns';
import { getDeliverablesWithProgressUrl } from '../../config/api-endpoints';

// URL params
interface DeliverableProgressParams {
  projectId: string;
}

const DeliverableProgress: React.FC = () => {
  // Extract project ID from URL params
  const { projectId } = useParams<DeliverableProgressParams>();  
  const { user } = useAuth();

  // Ref for the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use standardized hooks for data access
  const { 
    project, 
    currentPeriod: initialPeriod, 
    isLoading: isLoadingProject 
  } = useProjectInfo(projectId, user?.token);
  
  // Get deliverable gates using the standardized hook
  const { gates, gatesDataSource, isLoading: isLoadingGates } = useDeliverableGateDataProvider();
  
  // Use the standardized period manager hook for handling periods
  const {
    selectedPeriod,
    progressDate,
    incrementPeriod,
    decrementPeriod,
    setSelectedPeriod
  } = usePeriodManager(initialPeriod, 
    project?.progressStart ? String(project.progressStart) : null
  );

  // Get screen size using the standardized hook
  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';

  // Use the progress controller for grid operations
  const {
    handleRowUpdating,
    handleRowValidating,
    handleGridInitialized,
    handleEditorPreparing
  } = useDeliverableProgressCollectionController(
    user?.token,
    projectId,
    selectedPeriod ?? initialPeriod ?? 0
  );
  
  // Prepare endpoint URL with period parameter using the standardized function
  const periodToUse = selectedPeriod ?? initialPeriod ?? 0;
  const endpoint = getDeliverablesWithProgressUrl(projectId, periodToUse);

  // Check if any data is still loading
  const isLoading = isLoadingProject || isLoadingGates;

  // Reference to the DataGrid component
  const dataGridRef = useRef<any>(null);

  // Reference to the ScrollView component
  const scrollViewRef = useRef<ScrollView>(null);

  // Enhanced grid initialization that ensures record count is displayed
  const onGridInitialized = (e: any) => {
    // Call the original handler from the controller
    handleGridInitialized(e);
    
    // Store the grid reference
    dataGridRef.current = e.component;
  };

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
        
        <ScrollView
          ref={scrollViewRef}
          className="progress-scrollview"
          height={isMobile ? 'calc(100vh - 130px)' : 'auto'}
        >
          {/* Project header with period info */}
          {project && (
            <div className="period-selector">
              <div className="period-details">
                <div className="period-info">
                  <div className="info-item info-item-period">
                    <span className="info-label">Reporting Period:</span>
                    <div className="period-stepper">
                      <Button
                        icon="spindown"
                        onClick={() => decrementPeriod()}
                        disabled={selectedPeriod === 0 || isLoading}
                        stylingMode="text"
                        className="period-button down-button"
                      />
                      <NumberBox
                        value={selectedPeriod || 0}
                        min={0}
                        showSpinButtons={false}
                        inputAttr={{ 'aria-label': 'Period Number' }}
                        onKeyDown={(e) => {
                          // Allow keyboard navigation (up/down arrows)
                          if (e.event && e.event.key === 'ArrowUp') {
                            incrementPeriod();
                            e.event.preventDefault();
                          } else if (e.event && e.event.key === 'ArrowDown') {
                            decrementPeriod();
                            e.event.preventDefault();
                          }
                        }}
                        onValueChanged={(e) => {
                          // Handle direct input
                          if (e.event && e.event.type === 'change') {
                            if (e.value !== null && e.value !== undefined) {
                              const periodNumber = parseInt(e.value.toString(), 10);
                              if (periodNumber >= 0) {
                                setSelectedPeriod(periodNumber);
                              }
                            }
                          }
                        }}
                        className="period-number-box"
                        width={60}
                        stylingMode="outlined"
                      />
                      <Button
                        icon="spinup"
                        onClick={() => incrementPeriod()}
                        disabled={isLoading}
                        stylingMode="text"
                        className="period-button up-button"
                      />
                    </div>
                    <span className="secondary-info">(weeks from project start)</span>
                  </div>
                  <div className="info-divider"></div>
                  <div className="info-item">
                    <span className="info-label">Progress Date:</span>
                    <strong className="info-value">{progressDate.toLocaleDateString()}</strong>
                  </div>
                  <div className="info-divider"></div>
                  <div className="info-item">
                    <span className="info-label">Project Start Date:</span>
                    <strong className="info-value">
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
          <ODataGrid
            title=""
            endpoint={endpoint}
            columns={createDeliverableProgressColumns(gatesDataSource, isMobile)}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onRowValidating={handleRowValidating}
            onInitialized={onGridInitialized}
            onEditorPreparing={handleEditorPreparing}
            allowDeleting={false}
            showRecordCount={true}
            countColumn="bookingCode"
            customGridHeight={isMobile ? 500 : 970}
          />
        </ScrollView>
      </div>
      )}
    </div>
  );
};

export default DeliverableProgress;
