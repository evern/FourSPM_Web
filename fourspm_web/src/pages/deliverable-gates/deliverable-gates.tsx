import React from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { deliverableGateColumns } from './deliverable-gate-columns';
import { useAuth } from '../../contexts/auth';
import { DELIVERABLE_GATES_ENDPOINT } from '@/config/api-endpoints';
import './deliverable-gates.scss';
import { DeliverableGatesProvider, useDeliverableGates } from '@/contexts/deliverable-gates/deliverable-gates-context';
import { useDeliverableGateGridHandlers } from '@/hooks/grid-handlers/useDeliverableGateGridHandlers';
import { LoadPanel } from 'devextreme-react/load-panel';
import { ErrorMessage } from '@/components';

// Main DeliverableGates component following the Collection View Doctrine pattern
const DeliverableGates: React.FC = () => {
  return (
    <DeliverableGatesProvider>
      <DeliverableGatesContent />
    </DeliverableGatesProvider>
  );
};

const DeliverableGatesContent = React.memo((): React.ReactElement => {
  const { user } = useAuth();
  const { state } = useDeliverableGates();
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDeliverableGateGridHandlers({ userToken: user?.token });

  // For demonstration, assume loading/error state comes from context only
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
          />
        )}
      </div>
    </div>
  );
});

export default DeliverableGates;
