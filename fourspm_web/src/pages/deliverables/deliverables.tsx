import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createDeliverableColumns } from './deliverable-columns';
import ScrollToTop from '../../components/scroll-to-top';
import './deliverables.scss';
import { DELIVERABLES_ENDPOINT } from '@/config/api-endpoints';
import { useDeliverables } from '@/contexts/deliverables/deliverables-context';
import { useScreenSizeClass } from '../../utils/media-query';
import { LoadPanel } from 'devextreme-react/load-panel';
import { DeliverablesProvider } from '@/contexts/deliverables/deliverables-context';
import { useDeliverableGridHandlers } from '@/hooks/grid-handlers/useDeliverableGridHandlers';
import { useAuth } from '@/contexts/auth';

interface DeliverableParams {
  projectId: string;
}

/**
 * Main Deliverables component that provides the DeliverableEditorContext
 * This follows the pattern of keeping context providers close to where they're used
 * The component is now simplified since all the logic has been moved to the context
 */
export function Deliverables(): React.ReactElement {
  // Extract project ID from URL params
  const { projectId } = useParams<DeliverableParams>();
  
  // Validate projectId exists
  if (!projectId) {
    return <div className="error-message">Project ID is missing from the URL.</div>;
  }
  
  return (
    <DeliverablesProvider projectId={projectId}>
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
  const {
    state,
    project,
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading
  } = useDeliverables();
  
  // Get projectId from state
  const projectId = state.projectGuid;
  
  // Get user auth token for API calls
  const { user } = useAuth();
  
  // Get grid handlers directly from the hook - matching variation-deliverables.tsx pattern
  const {
    handleGridInitialized,
    handleRowUpdating,
    handleRowInserting,
    handleRowValidating,
    handleRowRemoving,
    handleInitNewRow,
    handleEditorPreparing
  } = useDeliverableGridHandlers({
    projectGuid: projectId || '',
    userToken: user?.token, // Pass the user token to ensure authenticated API calls
    project // Pass project directly for client/project info
  });
  

  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Create columns with the lookup data sources from dedicated providers
  const columns = useMemo(() => {
    // Only create columns when lookup data is ready to prevent issues with undefined datasources
    if (isLookupDataLoading || !state.lookupDataLoaded) {
      return [];
    }
    
    return createDeliverableColumns(areasDataSource, disciplinesDataSource, documentTypesDataSource);
  }, [areasDataSource, disciplinesDataSource, documentTypesDataSource, isLookupDataLoading, state.lookupDataLoaded]);
  
  // Adjust columns for mobile size if needed - also memoized to prevent unnecessary filtering
  const mobileAdjustedColumns = useMemo(() => {
    return isMobile 
      ? columns.filter(c => c.dataField !== 'description') // Example: Hide description on mobile
      : columns;
  }, [columns, isMobile]);
  
  // Determine if the grid should be rendered (when lookup data is loaded)
  const shouldRenderGrid = !isLookupDataLoading && state.lookupDataLoaded;
  
  return (
    <div className="deliverables-container">
      {/* Display error message if there is one */}
      {state.error && (
        <div className="alert alert-danger">
          Error: {state.error}
        </div>
      )}
      
      {/* Loading indicator */}
      <LoadPanel 
        visible={state.loading || isLookupDataLoading} 
        message={state.loading ? 'Loading deliverables...' : 'Loading reference data...'}
        position={{ of: '.custom-grid-wrapper' }}
      />
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables'}
        </div>
        
        {shouldRenderGrid && (
          <ODataGrid
            title=" "
            endpoint={DELIVERABLES_ENDPOINT}
            columns={mobileAdjustedColumns}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onEditorPreparing={handleEditorPreparing}
            onInitialized={handleGridInitialized}
            defaultFilter={[["projectGuid", "=", state.projectGuid]]}
            countColumn="guid"
            defaultSort={[{ selector: 'internalDocumentNumber', desc: false }]}
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