import React, { useCallback, useEffect } from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { deliverableGateColumns } from './deliverable-gate-columns';
import { DELIVERABLE_GATES_ENDPOINT } from '@/config/api-endpoints';
import './deliverable-gates.scss';
import { DeliverableGatesProvider, useDeliverableGates } from '../../contexts/deliverable-gates/deliverable-gates-context';
import { useDeliverableGateGridHandlers } from '@/hooks/grid-handlers/useDeliverableGateGridHandlers';
import { LoadPanel } from 'devextreme-react/load-panel';
import { ErrorMessage } from '@/components';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';
import { GRID_STATE_DELIVERABLE_GATES } from '../../utils/grid-state-keys';

// Main DeliverableGates component following the Collection View Doctrine pattern
const DeliverableGates: React.FC = () => {
  return (
    <DeliverableGatesProvider>
      <DeliverableGatesContent />
    </DeliverableGatesProvider>
  );
};

const DeliverableGatesContent = React.memo((): React.ReactElement => {
  // Get state from context
  const { state } = useDeliverableGates();

  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check deliverable gate edit permissions
  const canEditDeliverableGates = useCallback(() => {
    return canEdit(PERMISSIONS.DELIVERABLES.EDIT.split('.')[0]); // Extract 'deliverables' from 'deliverables.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditDeliverableGates() && !state.loading && !permissionsLoading) {
      showReadOnlyNotification('deliverable gates');
    }
  }, [canEditDeliverableGates, state.loading, permissionsLoading]);

  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDeliverableGateGridHandlers(); // Using Optimized Direct Access Pattern - no parameters needed

  // Get loading and error state from context
  const isLoading = state.loading;
  const hasError = !!state.error;

  // Create a consistent title for display and export
  const gridTitle = 'Deliverable Gates';

  return (
    <div className="deliverable-gates-container">
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
          title="Error Loading Deliverable Gates"
          message={state.error || 'An unknown error occurred'}
        />
      )}
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{gridTitle}</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
            exportFileName={gridTitle}
            endpoint={DELIVERABLE_GATES_ENDPOINT}
            columns={deliverableGateColumns}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onInitialized={handleGridInitialized}
            defaultSort={[{ selector: 'maxPercentage', desc: false }]}
            customGridHeight={900}
            allowAdding={canEditDeliverableGates()}
            allowUpdating={canEditDeliverableGates()}
            allowDeleting={canEditDeliverableGates()}
            stateStorageKey={GRID_STATE_DELIVERABLE_GATES}
            stateStoring={{ enabled: true }}
            allowGrouping={true}
            showGroupPanel={true}
          />
        )}
      </div>
    </div>
  );
});

export default DeliverableGates;
