import React, { useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components';
import { variationColumns } from './variation-columns';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { useMSALAuth } from '../../contexts/msal-auth';
// Removed useProjectInfo import as we now get project from context
import { VariationsProvider, useVariations } from '@/contexts/variations/variations-context';
import { useVariationGridHandlers } from '../../hooks/grid-handlers/useVariationGridHandlers';
import ScrollToTop from '../../components/scroll-to-top';
import './variations.scss';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';

// Variation params interface
interface VariationParams {
  projectId: string;
}

// Variations component using the Context + Reducer pattern for clean separation of view and logic
function Variations(): React.ReactElement {
  return (
    <VariationsProvider>
      <VariationsContent />
    </VariationsProvider>
  );
}

// Internal component that consumes the context
const VariationsContent = (): React.ReactElement => {
  const { projectId } = useParams<VariationParams>();
  
  // Get data from our combined context - now including project data
  const { 
    state: { loading, error, editorError }, 
    project, 
    isLookupDataLoading
  } = useVariations();

  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check variations edit permissions
  const canEditVariations = useCallback(() => {
    return canEdit(PERMISSIONS.VARIATIONS.EDIT.split('.')[0]); // Extract 'variations' from 'variations.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditVariations() && !loading && !permissionsLoading) {
      showReadOnlyNotification('variations');
    }
  }, [canEditVariations, loading, permissionsLoading]);

  // Use our custom grid handlers
  const {
    // Row operations
    handleRowValidating,
    handleRowInserting,
    handleRowRemoving,
    // Editor operations
    handleEditorPreparing,
    handleInitNewRow,
    // Status operations
    handleApproveVariation,
    handleRejectVariation
  } = useVariationGridHandlers({
    projectId
  });
  
  // Create variation columns configuration with handlers
  const variationColumnsConfig = {
    handleApproveVariation,
    handleRejectVariation,
    showSuccess: (message: string) => notify({
      message: `Success: ${message}`,
      type: 'success',
      displayTime: 2000,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    }),
    showError: (message: string) => notify({
      message: `Error: ${message}`,
      type: 'error',
      displayTime: 3500,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    })
  };
  
  // Create project filter for grid
  const projectFilter: [string, string, any][] = projectId ? [["projectGuid", "=", projectId]] : [];
  
  // We now use handleEditorPreparing directly as it contains all needed customizations

  // Display error notifications whenever errors occur
  useEffect(() => {
    if (error || editorError) {
      notify({
        message: `Error: ${error || editorError}`,
        type: 'error',
        displayTime: 3500,
        position: {
          at: 'top center',
          my: 'top center',
          offset: '0 10'
        }
      });
    }
  }, [error, editorError]);
  
  // Create a consistent title for display and export
  const gridTitle = project ? `${project.projectNumber} - ${project.name} Variations` : 'Variations';

  return (
    <div className="variations-container">      
      <LoadPanel 
        visible={isLookupDataLoading} 
        message={loading ? 'Loading variations...' : 'Loading project data...'}
        position={{ of: '.custom-grid-wrapper' }}
      />
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {gridTitle}
        </div>
        
        <ODataGrid
          title=" "
          exportFileName={gridTitle}
          endpoint={VARIATIONS_ENDPOINT}
          columns={variationColumns(variationColumnsConfig)}
          keyField="guid"
          onRowValidating={handleRowValidating}
          onRowInserting={handleRowInserting}
          onRowRemoving={handleRowRemoving}
          onEditorPreparing={handleEditorPreparing}
          onInitNewRow={handleInitNewRow}
          allowAdding={canEditVariations()}
          allowUpdating={canEditVariations()}
          allowDeleting={canEditVariations()}
          defaultFilter={projectFilter}
          // Add default sort to ensure consistent query parameters
          defaultSort={[{ selector: 'created', desc: true }]}
          customGridHeight={900}
          // Add countColumn for proper OData count handling
          countColumn="guid"
        />
      </div>
      
      <ScrollToTop />
    </div>
  );
};

export default Variations;
