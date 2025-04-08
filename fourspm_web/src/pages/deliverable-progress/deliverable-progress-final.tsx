import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import './deliverable-progress.scss';

// Import contexts
import { DeliverableProgressProvider, useDeliverableProgress } from '../../contexts/deliverable-progress/deliverable-progress-context';

// Import custom hooks
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import { useDeliverableGateDataProvider } from '../../hooks/data-providers/useDeliverableGateDataProvider';
import { usePeriodManager } from '../../hooks/utils/usePeriodManager';
import { useScreenSizeClass } from '../../utils/media-query';

// Import components
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import LoadPanel from 'devextreme-react/load-panel';
import Button from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';
import { ScrollView } from 'devextreme-react/scroll-view';

// Import types and constants
import { createDeliverableProgressColumns } from './deliverable-progress-columns';
import { getDeliverablesWithProgressUrl } from '../../config/api-endpoints';

// URL params interface
interface DeliverableProgressParams {
  projectId: string;
}

/**
 * Main component that sets up the context provider
 */
export function DeliverableProgressFinal(): React.ReactElement {
  // Extract project ID from URL params
  const { projectId } = useParams<DeliverableProgressParams>();
  const { user } = useAuth();

  // Get project info to pass to the context provider
  const { currentPeriod: initialPeriod, project } = useProjectInfo(projectId, user?.token);
  const startDate = project?.progressStart ? String(project.progressStart) : undefined;
  
  // Validate projectId exists
  if (!projectId) {
    return <div className="error-message">Project ID is missing from the URL.</div>;
  }
  
  return (
    <DeliverableProgressProvider 
      projectId={projectId}
      initialPeriod={initialPeriod || 0}
      startDate={startDate}
    >
      <DeliverableProgressContent />
    </DeliverableProgressProvider>
  );
}

/**
 * Internal component that consumes the context
 */
const DeliverableProgressContent = (): React.ReactElement => {
  // Get route parameters
  const { projectId } = useParams<DeliverableProgressParams>();
  const { user } = useAuth();
  
  // Get handlers from the context - the context now delegates period management to usePeriodManager
  const {
    state,
    handleRowUpdating,
    handleRowValidating,
    handleEditorPreparing,
    handleGridInitialized
  } = useDeliverableProgress();
  
  // Use standardized hooks for project info
  const { project, currentPeriod: initialPeriod, isLoading: isLoadingProject } = useProjectInfo(projectId, user?.token);
  
  // Get deliverable gates using the data provider hook
  const { gates, gatesDataSource, isLoading: isLoadingGates } = useDeliverableGateDataProvider();
  
  // Ensure gates data is properly initialized for lookups
  useEffect(() => {
    if (gatesDataSource && typeof gatesDataSource.load === 'function') {
      console.log('Pre-loading gates data for lookup display');
      gatesDataSource.load();
    }
  }, [gatesDataSource]);
  
  // Get period info directly from the context
  // This ensures we're using the same period state that the grid handlers use
  const {
    selectedPeriod,
    progressDate,
    incrementPeriod,
    decrementPeriod,
    setSelectedPeriod
  } = useDeliverableProgress();
  
  // No longer need local period manager as we get periods from context
  
  // No longer need to sync with context, as context now delegates to usePeriodManager
  
  // Get screen size
  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Refs for components
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Track when data is fully loaded for grid display
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Check if any data is still loading
  const isLoading = isLoadingProject || isLoadingGates || state.loading;
  
  // Prepare endpoint URL with period parameter
  // Use selectedPeriod from the period manager directly, as it's no longer in state
  const endpoint = useMemo(() => {
    return getDeliverablesWithProgressUrl(projectId, selectedPeriod || 0);
  }, [projectId, selectedPeriod]);
  
  // Set data as loaded once all lookups are loaded
  useEffect(() => {
    if (!isLoadingGates) {
      setDataLoaded(true);
    }
  }, [isLoadingGates]);
  
  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => {
    // Log to verify gatesDataSource is being passed correctly
    console.log('[DeliverableProgressFinal] Creating columns with gates data source:', 
      gatesDataSource ? 'defined' : 'undefined');
      
    // Use the same function as the original implementation to maintain consistency
    return createDeliverableProgressColumns(gatesDataSource, isMobile);
  }, [gatesDataSource, isMobile]);

  // Use only the centralized grid handler for all grid operations
  // This ensures a single source of truth for the grid instance
  const onGridInitialized = useCallback((e: any) => {
    // Pass directly to the centralized handler
    handleGridInitialized(e);
  }, [handleGridInitialized]);
  
  return (
    <div className="progress-container" ref={containerRef}>
      {/* Show loading indicator when data is being fetched */}
      <LoadPanel 
        visible={isLoading} 
        position={{ of: '.progress-container' }}
        showIndicator={true}
        showPane={true}
      />
      
      {/* Only render content when data is loaded */}
      {!isLoading && dataLoaded && project && (
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
                    <strong className="info-value">
                      {progressDate?.toLocaleDateString()}
                    </strong>
                  </div>
                  <div className="info-divider"></div>
                  <div className="info-item">
                    <span className="info-label">Project Start Date:</span>
                    <strong className="info-value">
                      {project?.progressStart
                        ? new Date(project.progressStart).toLocaleDateString()
                        : 'Not set'}
                    </strong>
                    {project?.progressStart && (
                      <span className="secondary-info">({new Date(project.progressStart).toLocaleString('en-US', {weekday: 'long'})})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <ODataGrid
              title=""
              endpoint={endpoint}
              columns={columns}
              keyField="guid"
              onRowUpdating={handleRowUpdating}
              onRowValidating={handleRowValidating}
              onInitialized={onGridInitialized}
              onEditorPreparing={handleEditorPreparing}
              allowAdding={false}
              allowDeleting={false}
              showRecordCount={true}
              countColumn="guid"
              customGridHeight={isMobile ? 500 : 800}
              defaultSort={[{ selector: 'internalDocumentNumber', desc: false }]}
            />
          </ScrollView>
        </div>
      )}
    </div>
  );
};

export default DeliverableProgressFinal;
