import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import './deliverable-progress.scss';

// Import contexts
import { DeliverableProgressProvider, useDeliverableProgress } from '../../contexts/deliverable-progress/deliverable-progress-context';

// Import custom hooks
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import { useDeliverableGateDataProvider } from '../../hooks/data-providers/useDeliverableGateDataProvider';
import { useScreenSizeClass } from '../../utils/media-query';
import { useDeliverableProgressGridHandlers } from '../../hooks/grid-handlers/useDeliverableProgressGridHandlers';

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
export function DeliverableProgress(): React.ReactElement {
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
  
  // Get state and period management from the context
  const {
    state,
    selectedPeriod,
    progressDate,
    incrementPeriod,
    decrementPeriod,
    setSelectedPeriod
  } = useDeliverableProgress();
  
  // Use standardized hooks for project info
  const { project, currentPeriod: initialPeriod, isLoading: isLoadingProject } = useProjectInfo(projectId, user?.token);
  
  // Get deliverable gates using the data provider hook
  const { gates, gatesDataSource, isLoading: isLoadingGates } = useDeliverableGateDataProvider();
  
  // Ensure gates data is properly initialized for lookups
  useEffect(() => {
    if (gatesDataSource && typeof gatesDataSource.load === 'function') {
      gatesDataSource.load();
    }
  }, [gatesDataSource]);
  
  // Get grid handlers directly from the hook - following deliverables.tsx pattern
  const {
    handleRowUpdating,
    handleRowValidating,
    handleEditorPreparing,
    handleGridInitialized
  } = useDeliverableProgressGridHandlers({
    projectGuid: projectId || '',
    userToken: user?.token,
    getSelectedPeriod: () => selectedPeriod || 0,
    progressDate: progressDate || new Date()
  });
  
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
  
  // Check if any data is still loading - follow staggered loading pattern
  const isLoading = state.loading || isLoadingProject || isLoadingGates;
  
  // Only proceed with next loading stage when previous is complete
  const shouldRenderGrid = !isLoading && !!project && selectedPeriod !== null;
  
  // Set endpoint for the grid - only when all prerequisites are loaded
  const endpoint = shouldRenderGrid ? getDeliverablesWithProgressUrl(projectId, selectedPeriod || 0) : '';
  
  // Set data as loaded once all lookups are loaded
  useEffect(() => {
    if (!isLoadingGates) {
      setDataLoaded(true);
    }
  }, [isLoadingGates]);
  
  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => {
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
      {isLoading ? (
        <LoadPanel
          shadingColor="rgba(0,0,0,0.1)"
          position={{ of: ".progress-container" }}
          showIndicator={true}
          showPane={true}
          visible={true}
          shading={true}
        />
      ) : shouldRenderGrid ? (
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
              defaultSort={[{ selector: 'created', desc: false }]}
            />
          </ScrollView>
        </div>
      ) : (
        <div className="loading-message">Waiting for data to load...</div>
      )}
    </div>
  );
};

export default DeliverableProgress;
