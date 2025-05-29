import React, { useMemo, useCallback, useEffect } from 'react';
import { ErrorMessage } from '@/components';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '@/components';
import { createVariationDeliverableColumns, processVariationDeliverableColumns } from './variation-deliverable-columns';
import { GRID_STATE_VARIATIONS } from '../../utils/grid-state-keys';
import { ScrollToTop } from '@/components';
import './variation-deliverables.scss';
import { getVariationDeliverablesWithParamUrl } from '@/config/api-endpoints';
import { useScreenSizeClass } from '@/utils/media-query';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { VariationDeliverablesProvider, useVariationDeliverables } from '@/contexts/variation-deliverables/variation-deliverables-context';
import { DeliverablesProvider } from '@/contexts/deliverables/deliverables-context';
// Use the DeliverableEditor context from deliverables context
import { useVariationDeliverableGridHandlers } from '@/hooks/grid-handlers/useVariationDeliverableGridHandlers';
import { useVariationInfo } from '@/hooks/utils/useVariationInfo';
import { useAuth } from '@/contexts/auth';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';


interface VariationDeliverableParams {
  variationId: string;
}

// Main component that sets up context providers for Variation Deliverables
export function VariationDeliverables(): React.ReactElement {
  // Get route parameters - ALWAYS call hooks at the top level
  const { variationId } = useParams<VariationDeliverableParams>();
  
  // Get the variation info to retrieve the correct project ID
  // Always call hooks before any conditional returns
  const { projectGuid, loading } = useVariationInfo(variationId || '');
  
  // Validate variationId exists
  if (!variationId) {
    return <div className="error-message">Variation ID is missing from the URL.</div>;
  }
  
  // Show loading state while we fetch the variation data
  if (loading) {
    return <div className="loading-message">Loading variation data...</div>;
  }
  
  // Validate that we got a project ID from the variation
  if (!projectGuid) {
    return <div className="error-message">Cannot load project for this variation.</div>;
  }
  
  return (
    <DeliverablesProvider projectId={projectGuid}>
      <VariationDeliverablesProvider variationId={variationId}>
        <VariationDeliverablesContent />
      </VariationDeliverablesProvider>
    </DeliverablesProvider>
  );
}

// Nested component that consumes both contexts
const VariationDeliverablesContent = React.memo((): React.ReactElement => {
  // Get variation ID from URL params
  const { variationId } = useParams<VariationDeliverableParams>();
  
  // Use the variation deliverables context
  const {
    // State (no token - it will be accessed directly at leaf methods)
    state: { loading, error },
    
    // Reference data
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    
    // Project and variation data
    project,
    variation,
    projectGuid
  } = useVariationDeliverables();

  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check variation deliverables edit permissions
  const canEditVariationDeliverables = useCallback(() => {
    return canEdit(PERMISSIONS.VARIATIONS.EDIT.split('.')[0]); // Extract 'variations' from 'variations.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditVariationDeliverables() && !loading && !permissionsLoading) {
      showReadOnlyNotification('variation deliverables');
    }
  }, [canEditVariationDeliverables, loading, permissionsLoading]);
  
  // We'll use the variation deliverables context for validation
  // In a future step, this would use a dedicated deliverable editor context
  
  // Get grid handlers with both context dependencies
  const {
    handleGridInitialized,
    handleRowUpdating,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    handleCancellationClick
  } = useVariationDeliverableGridHandlers({
    project,
    projectGuid
  });

  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Determine if we're still loading any data
  const isLoading = loading || isLookupDataLoading;
  
  // Combine all error sources, but ignore the 'Missing project ID parameter' error
  // which happens during normal loading sequence
  const hasError = error !== null && error !== 'Missing project ID parameter';
  
  // Set the grid to read-only if the variation has been submitted
  const isReadOnly = variation?.submitted !== null && variation?.submitted !== undefined;
  
  // Create columns with the lookup data sources from dedicated providers
  const columns = useMemo(() => {
    // Only create columns when lookup data is ready
    if (isLoading || !areasDataSource || !disciplinesDataSource || !documentTypesDataSource) {
      return [];
    }
    
    // Wrap handleCancellationClick to handle permission check first
    const wrappedCancellationClick = (e: any) => {
      // Check for permission-based read-only
      if (!canEditVariationDeliverables()) {
        // Show notification directly here
        notify({
          message: 'You do not have permission to modify variation deliverables.',
          type: 'warning',
          displayTime: 3000,
          position: { at: 'top center', my: 'top center' }
        });
        return;
      }
      
      // Only pass the variation status to the original handler
      return handleCancellationClick(e, isReadOnly);
    };
    
    const baseColumns = createVariationDeliverableColumns(
      areasDataSource,
      disciplinesDataSource,
      documentTypesDataSource,
      isMobile,
      wrappedCancellationClick,
      isReadOnly || !canEditVariationDeliverables() // Combined readonly flag for column configuration
    );
    
    // Process columns to ensure all have a dataField property for ODataGrid compatibility
    return processVariationDeliverableColumns(baseColumns);
  }, [areasDataSource, disciplinesDataSource, documentTypesDataSource, isLoading, isMobile, handleCancellationClick, isReadOnly]);
  
  // Adjust columns for mobile size if needed
  const mobileAdjustedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    return isMobile 
      ? columns.filter(c => c.dataField !== 'description') // Example: Hide description on mobile
      : columns;
  }, [columns, isMobile]);
  
  // Create a consistent title for display and export
  const gridTitle = project && variation 
    ? `${project.name} - ${variation.name} Deliverables` 
    : 'Variation Deliverables';

  return (
    <div className="variation-deliverables-container">
      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={isLoading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      

      {hasError && (
        <ErrorMessage
          title="Error Loading Variation Deliverables"
          message={error || 'An unknown error occurred'}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {gridTitle}
        </div>
        
        {!isLoading && !hasError && variation && variationId && (
          <ODataGrid
            title=" "
            exportFileName={gridTitle}
            endpoint={getVariationDeliverablesWithParamUrl(variationId)}
            columns={mobileAdjustedColumns.length > 0 ? mobileAdjustedColumns : []}
            keyField="guid"

            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowInserting={handleRowInserting}
            onEditorPreparing={handleEditorPreparing}
            onInitialized={handleGridInitialized}
            countColumn="guid"
            defaultSort={[{ selector: 'internalDocumentNumber', desc: false }]}
            allowAdding={!isReadOnly && canEditVariationDeliverables()}
            allowUpdating={!isReadOnly && canEditVariationDeliverables()}
            allowDeleting={false}
            customGridHeight={900}
            stateStorageKey={GRID_STATE_VARIATIONS}
            stateStoring={{ enabled: true }}
            allowGrouping={true}
            showGroupPanel={true}
            // The ref is passed to the grid via onInitialized instead of directly
            storeOptions={{
              fieldTypes: {
                variationGuid: 'Guid',
                projectGuid: 'Guid',
                originalDeliverableGuid: 'Guid'
              }
            }}
            // Note: Add virtual scrolling in a subsequent ticket
            // The ODataGrid component needs to be updated to support these advanced features
          />
        )}

      </div>
      <ScrollToTop />
    </div>
  );
});

export default VariationDeliverables;
