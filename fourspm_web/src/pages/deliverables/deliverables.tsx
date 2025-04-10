import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createDeliverableColumns } from './deliverable-columns';
import { useAuth } from '../../contexts/auth';
import ScrollToTop from '../../components/scroll-to-top';
import './deliverables.scss';
import { DELIVERABLES_ENDPOINT } from '@/config/api-endpoints';
import { useDeliverables } from '@/contexts/deliverables/deliverables-context';
import { useAreaDataProvider } from '../../hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../../hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../../hooks/data-providers/useDocumentTypeDataProvider';
import { useScreenSizeClass } from '../../utils/media-query';
import { useProjectInfo } from '@/hooks/utils/useProjectInfo';
import { LoadPanel } from 'devextreme-react/load-panel';
import { DeliverablesProvider } from '@/contexts/deliverables/deliverables-context';
import { useDeliverableGridHandlers } from '@/hooks/grid-handlers/useDeliverableGridHandlers';
import { GridRowEvent } from '@/hooks/grid-handlers/useDeliverableGridValidator';

interface DeliverableParams {
  projectId: string;
}

/**
 * Main Deliverables component that provides the DeliverableEditorContext
 * This follows the pattern of keeping context providers close to where they're used
 */
export function Deliverables(): React.ReactElement {
  // Extract project ID from URL params
  const { projectId } = useParams<DeliverableParams>();
  const { user } = useAuth();

  // Get project info to pass to the context provider
  const { project } = useProjectInfo(projectId, user?.token);
  
  // Validate projectId exists
  if (!projectId) {
    return <div className="error-message">Project ID is missing from the URL.</div>;
  }
  
  return (
    <DeliverablesProvider>
      <DeliverablesContent />
    </DeliverablesProvider>
  );
}

/**
 * Internal component that consumes the DeliverableEditorContext
 * Uses the Context + Reducer pattern for clean separation of view and logic.
 * This component focuses purely on rendering and delegating events to the context.
 */
const DeliverablesContent = (): React.ReactElement => {
  const { projectId } = useParams<DeliverableParams>();
  const { user } = useAuth();
  const { state: deliverableState } = useDeliverables();
  const [dataLoaded, setDataLoaded] = useState(false);
  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Get project info using the standardized hook
  const { project, isLoading: isProjectLoading } = useProjectInfo(projectId, user?.token);
  
  // Get data providers for lookup data
  const { areasDataSource, isLoading: areasLoading } = useAreaDataProvider(projectId);
  const { disciplinesDataSource, isLoading: disciplinesLoading } = useDisciplineDataProvider();
  const { documentTypesDataSource, isLoading: documentTypesLoading } = useDocumentTypeDataProvider();
  
  // Editor state is no longer needed as we're using grid handlers directly
  
  // Get grid handlers from the custom hook - validation is now handled internally by useDeliverableGridValidator
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow: baseHandleInitNewRow,
    handleEditorPreparing,
    handleGridInitialized
  } = useDeliverableGridHandlers({
    projectGuid: projectId,
    userToken: user?.token
  });
  
  // Combine the grid handler's init new row with additional project-specific logic
  const handleInitNewRowWithProject = useCallback((e: GridRowEvent) => {
    // First call the base handler from useDeliverableGridHandlers
    baseHandleInitNewRow(e);
    
    // Then add project-specific data
    if (e.data) {
      // Add client and project numbers if available from the project
      if (project) {
        if (project.client) {
          e.data.clientNumber = project.client.number || '';
        }
        if (project.projectNumber) {
          e.data.projectNumber = project.projectNumber || '';
        }
      }
    }
  }, [baseHandleInitNewRow, project]);
  
  // Wait for all lookup data to load
  useEffect(() => {
    // Track all loading states
    const isLoading = areasLoading || disciplinesLoading || documentTypesLoading || isProjectLoading;
    
    // When all data is loaded
    if (!isLoading) {
      setDataLoaded(true);
    }
  }, [areasLoading, disciplinesLoading, documentTypesLoading, isProjectLoading]);
  
  // Create columns with the cached lookup data sources
  const columns = createDeliverableColumns(areasDataSource, disciplinesDataSource, documentTypesDataSource);
  
  // Adjust columns for mobile size if needed
  const mobileAdjustedColumns = isMobile 
    ? columns.filter(c => c.dataField !== 'description') // Example: Hide description on mobile
    : columns;

  return (
    <div className="deliverables-container">
      {/* Display error message if there is one */}
      {deliverableState.error && (
        <div className="alert alert-danger">
          Error: {deliverableState.error}
        </div>
      )}
      
      {/* Loading indicator */}
      <LoadPanel 
        visible={deliverableState.loading || !dataLoaded} 
        message={deliverableState.loading ? 'Loading deliverables...' : 'Loading reference data...'}
        position={{ of: '.custom-grid-wrapper' }}
      />
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables'}
        </div>
        
        {dataLoaded && (
          <ODataGrid
            title=" "
            endpoint={DELIVERABLES_ENDPOINT}
            columns={mobileAdjustedColumns}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRowWithProject}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onEditorPreparing={handleEditorPreparing}
            onInitialized={handleGridInitialized}
            defaultFilter={[['projectGuid', '=', projectId]]}
            countColumn="guid"
            defaultSort={[{ selector: 'created', desc: true }]}
            allowAdding={true}
            allowUpdating={true}
            allowDeleting={true}
            customGridHeight={900}
          />
        )}
      </div>
      <ScrollToTop />
    </div>
  );
}

export default Deliverables;