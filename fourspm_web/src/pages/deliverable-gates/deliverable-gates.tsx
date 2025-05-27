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
    if (!canEditDeliverableGates() && !state.loading) {
      showReadOnlyNotification('deliverable gates');
    }
  }, [canEditDeliverableGates, state.loading]);

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
        <div className="grid-custom-title">Deliverable Gates</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
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
          />
        )}
      </div>
    </div>
  );
});

export default DeliverableGates;
