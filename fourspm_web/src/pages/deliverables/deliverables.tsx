import React, { useCallback, useEffect } from 'react';
import { ErrorMessage } from '@/components';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components';
import { createDeliverableColumns } from './deliverable-columns';
import { ScrollToTop } from '../../components';
import './deliverables.scss';
import { DELIVERABLES_ENDPOINT } from '@/config/api-endpoints';
import { useScreenSizeClass } from '../../utils/media-query';
import { LoadPanel } from 'devextreme-react/load-panel';
// Import token store for direct access
import { DeliverablesProvider, useDeliverables } from '@/contexts/deliverables/deliverables-context';
import { useDeliverableGridHandlers } from '@/hooks/grid-handlers/useDeliverableGridHandlers';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';
import { GRID_STATE_DELIVERABLES, getProjectSpecificStateKey } from '../../utils/grid-state-keys';

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
    project
  } = useDeliverables();
  
  // Create a consistent title for display and export
  const gridTitle = project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables';
  
  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check deliverable edit permissions
  const canEditDeliverables = useCallback(() => {
    return canEdit(PERMISSIONS.DELIVERABLES.EDIT.split('.')[0]); // Extract 'deliverables' from 'deliverables.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditDeliverables() && !state.loading && !permissionsLoading) {
      showReadOnlyNotification('deliverables');
    }
  }, [canEditDeliverables, state.loading, permissionsLoading]);
  
  // Get grid handlers directly from the hook
  const {
    handleGridInitialized: hookHandleGridInitialized,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing
  } = useDeliverableGridHandlers({
    projectGuid: projectId || '',
    project
  });
  
  // Use original grid initialization handler from the hook
  const handleGridInitialized = hookHandleGridInitialized;

  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Determine if we're still loading any data
  const isLoading = isLookupDataLoading;
  
  // Check for errors
  const hasError = state.error !== null;
  
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
          {gridTitle}
        </div>
        
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
            exportFileName={gridTitle}
            endpoint={DELIVERABLES_ENDPOINT}
            columns={mobileAdjustedColumns}
            keyField="guid"
            onRowValidating={handleRowValidating}
            onInitNewRow={handleInitNewRow}
            onEditorPreparing={handleEditorPreparing}
            onInitialized={handleGridInitialized}
            defaultFilter={[["projectGuid", "=", projectId]]}
            countColumn="guid"
            defaultSort={[{ selector: 'internalDocumentNumber', desc: false }]}
            allowAdding={canEditDeliverables()}
            allowUpdating={canEditDeliverables()}
            allowDeleting={canEditDeliverables()}
            customGridHeight={900}
            stateStorageKey={GRID_STATE_DELIVERABLES}
            stateStoring={{ enabled: true }}
            allowGrouping={true}
            showGroupPanel={true}
          />
        )}
      </div>
      <ScrollToTop />
    </div>
  );
});

export default Deliverables;