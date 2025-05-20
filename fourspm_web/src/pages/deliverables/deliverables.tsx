import React from 'react';
import { ErrorMessage } from '@/components';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components';
import { createDeliverableColumns } from './deliverable-columns';
import { ScrollToTop } from '../../components';
import './deliverables.scss';
import { DELIVERABLES_ENDPOINT } from '@/config/api-endpoints';
import { useScreenSizeClass } from '../../utils/media-query';
import { LoadPanel } from 'devextreme-react/load-panel';
// Token management is now handled by the DeliverablesContext
import { DeliverablesProvider, useDeliverables } from '@/contexts/deliverables/deliverables-context';
import { useDeliverableGridHandlers } from '@/hooks/grid-handlers/useDeliverableGridHandlers';

interface DeliverableParams {
  projectId: string;
}

/**
 * Main Deliverables component using context with React Query
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
 * Internal component that uses the deliverables context
 */
const DeliverablesContent = React.memo((): React.ReactElement => {
  // Get projectId from URL params directly
  const { projectId } = useParams<DeliverableParams>();

  // Use the deliverables context
  const {
    // State
    state,
    
    // Reference data
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    
    // Project data
    project,
    
    // Token state
    state: { token, loading: tokenLoading, error: tokenError }
  } = useDeliverables();
  
  // Get grid handlers directly from the hook
  const {
    handleGridInitialized: hookHandleGridInitialized,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing
  } = useDeliverableGridHandlers({
    projectGuid: projectId || '',
    userToken: state.token || undefined, // Use token from context
    project
  });
  
  // Use original grid initialization handler from the hook
  const handleGridInitialized = hookHandleGridInitialized;

  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Determine if we're still loading any data
  const isLoading = isLookupDataLoading || tokenLoading;
  
  // Combine all error sources
  const hasError = state.error !== null || tokenError !== null;
  
  // Create columns with the lookup data sources from dedicated providers
  const columns = React.useMemo(() => {
    // Only create columns when lookup data is ready
    if (isLoading || !areasDataSource || !disciplinesDataSource || !documentTypesDataSource) {
      return [];
    }
    
    return createDeliverableColumns(areasDataSource, disciplinesDataSource, documentTypesDataSource);
  }, [areasDataSource, disciplinesDataSource, documentTypesDataSource, isLoading]);
  
  // Adjust columns for mobile size if needed
  const mobileAdjustedColumns = React.useMemo(() => {
    return isMobile 
      ? columns.filter(c => c.dataField !== 'description') // Example: Hide description on mobile
      : columns;
  }, [columns, isMobile]);
  
  return (
    <div className="deliverables-container">
      {/* Loading indicator */}
      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={isLoading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      
      {/* Error message */}
      {hasError && (
        <ErrorMessage
          title="Error Loading Deliverables"
          message={state.error || 'An unknown error occurred'}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables'}
        </div>
        
        {!isLoading && !hasError && token && (
          <ODataGrid
            title=" "
            endpoint={DELIVERABLES_ENDPOINT}
            columns={mobileAdjustedColumns}
            keyField="guid"
            token={token}
            onRowValidating={handleRowValidating}
            onInitNewRow={handleInitNewRow}
            onEditorPreparing={handleEditorPreparing}
            onInitialized={handleGridInitialized}
            defaultFilter={[["projectGuid", "=", projectId]]}
            countColumn="guid"
            defaultSort={[{ selector: 'internalDocumentNumber', desc: false }]}
            allowAdding={true}
            allowUpdating={true}
            allowDeleting={true}
            customGridHeight={900}
          />
        )}
        {!isLoading && !hasError && !token && (
          <ErrorMessage
            title="Authentication Error"
            message="Unable to acquire authentication token. Please try refreshing the page."
          />
        )}
      </div>
      <ScrollToTop />
    </div>
  );
});

export default Deliverables;