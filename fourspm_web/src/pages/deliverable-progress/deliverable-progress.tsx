import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth';
import './deliverable-progress.scss';

// Import custom hooks
import { useScreenSizeClass } from '../../utils/media-query';
import { useDeliverableProgressGridHandlers } from '../../hooks/grid-handlers/useDeliverableProgressGridHandlers';
// We no longer need useProjectInfo as we get project from context

// Import components
import { ODataGrid } from '../../components';
import LoadPanel from 'devextreme-react/load-panel';
import Button from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';
import { ScrollView } from 'devextreme-react/scroll-view';

// Import types and constants
import { createDeliverableProgressColumns } from './deliverable-progress-columns';
import { getDeliverablesWithProgressUrl } from '../../config/api-endpoints';

// Import context
import { DeliverableProgressProvider, useDeliverableProgress } from '../../contexts/deliverable-progress/deliverable-progress-context';

// URL params interface
interface DeliverableProgressParams {
  projectId: string;
}

/**
 * Main component with Context Provider implementation
 * This follows the Collection View Doctrine pattern with a parent provider component
 */
export function DeliverableProgress(): React.ReactElement {
  // Extract project ID from URL params
  const { projectId } = useParams<DeliverableProgressParams>();
  
  // Validate projectId exists
  if (!projectId) {
    return <div className="error-message">Project ID is missing from the URL.</div>;
  }
  
  // Default initial period to 0 - context provider will handle this
  const initialPeriod = 0;
  
  // Return the provider wrapper with the content component
  return (
    <DeliverableProgressProvider 
      projectId={projectId}
      initialPeriod={initialPeriod}
    >
      <DeliverableProgressContent />
    </DeliverableProgressProvider>
  );
}

/**
 * Internal component that consumes the context
 * This implements the Collection View Doctrine pattern for the content component
 */
const DeliverableProgressContent = (): React.ReactElement => {
  // Use the context for state and data - now including project data
  const { 
    state, 
    selectedPeriod, 
    progressDate, 
    incrementPeriod, 
    decrementPeriod, 
    setSelectedPeriod,
    projectId,
    // Get project data and loading state from context
    project,
    isLookupDataLoading,
    // Get deliverable gates from context following Collection View Doctrine
    deliverableGates,
    isGatesLoading: gatesLoading,
    gatesError
  } = useDeliverableProgress();
  
  const { user } = useAuth();
  
  // Get grid handlers directly from the hook
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
    // Note: deliverableGates is now obtained directly from context in the hook
  });
  
  // Get screen size
  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Refs for components
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Create the endpoint URL with the current period
  const endpoint = useMemo(() => {
    if (!projectId || selectedPeriod === null) return '';
    return getDeliverablesWithProgressUrl(projectId, selectedPeriod || 0);
  }, [projectId, selectedPeriod]);
  
  // Create columns with deliverable gates data source
  const columns = useMemo(() => {
    return createDeliverableProgressColumns(deliverableGates);
  }, [deliverableGates]);
  
  // Track if grid should be rendered - based on data availability
  const [shouldRenderGrid, setShouldRenderGrid] = useState(false);
  
  // Wait for endpoint and columns to be available before rendering grid
  useEffect(() => {
    setShouldRenderGrid(!!endpoint && columns.length > 0 && !gatesLoading);
  }, [endpoint, columns, gatesLoading]);
  
  // Determine if all data is ready to render grid (for loading state handling)
  const isDataReady = useMemo(() => {
    return !!endpoint && columns.length > 0 && !gatesLoading && !isLookupDataLoading && shouldRenderGrid;
  }, [endpoint, columns, gatesLoading, isLookupDataLoading, shouldRenderGrid]);
  
  // Combine error states
  const error = state.error || gatesError;
  
  // Pass grid initialized event to handler
  const onGridInitialized = useCallback((e: any) => {
    // Pass directly to the centralized handler
    handleGridInitialized(e);
  }, [handleGridInitialized]);
  
  // Show error if one occurred
  if (error) {
    return <div className="error-message">Error loading data: {error instanceof Error ? error.message : String(error)}</div>;
  }  
  return (
    <div className="progress-container" ref={containerRef}>
      {/* Always render loading panel */}
      <LoadPanel
        shadingColor="rgba(0,0,0,0.1)"
        position={{ of: ".progress-container" }}
        showIndicator={true}
        showPane={true}
        visible={!isDataReady}
        shading={true}
      />
      
      {/* Always render title outside of conditional rendering */}
      <div className="grid-custom-title">
        {project ? `${project.projectNumber} - ${project.name} Progress Tracking` : 'Progress Tracking'}
      </div>
      
      {/* Only show error or content conditionally */}
      {error ? (
        <div className="error-message">Error loading data: {error instanceof Error ? error.message : String(error)}</div>
      ) : isDataReady && (
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
                      disabled={selectedPeriod === 0 || isLookupDataLoading}
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
                      disabled={isLookupDataLoading}
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
      )}
    </div>
  );
};

export default DeliverableProgress;
