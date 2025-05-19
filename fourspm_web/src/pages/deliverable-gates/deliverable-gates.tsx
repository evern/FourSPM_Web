import React from 'react';
import { ODataGrid } from '../../components';
import { deliverableGateColumns } from './deliverable-gate-columns';
import { useMSALAuth } from '../../contexts/msal-auth';
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
  // Get everything from the context including the token and token acquisition
  const { state, acquireToken } = useDeliverableGates();
  
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDeliverableGateGridHandlers({ acquireToken });

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
        {!isLoading && !hasError && state.token && (
          <ODataGrid
            title=" "
            endpoint={DELIVERABLE_GATES_ENDPOINT}
            columns={deliverableGateColumns}
            keyField="guid"
            token={state.token} // Pass the token from context
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onInitialized={handleGridInitialized}
            defaultSort={[{ selector: 'maxPercentage', desc: false }]}
            customGridHeight={900}
          />
        )}
        {!isLoading && !hasError && !state.token && (
          <ErrorMessage
            title="Authentication Error"
            message="Unable to acquire authentication token. Please try refreshing the page."
          />
        )}
      </div>
    </div>
  );
});

export default DeliverableGates;
