import React from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { deliverableGateColumns } from './deliverable-gate-columns';
import { DELIVERABLE_GATES_ENDPOINT } from '@/config/api-endpoints';
import './deliverable-gates.scss';
import { DeliverableGatesProvider, useDeliverableGates } from '../../contexts/deliverable-gates/deliverable-gates-context';
import { useToken } from '../../contexts/token-context';
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
  // Get state from context and token from useToken
  const { state } = useDeliverableGates();
  const { token, acquireToken } = useToken();

  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDeliverableGateGridHandlers({ acquireToken });

  // Get loading, error, and token state from context
  const isLoading = state.loading;
  const hasError = !!state.error;
  const hasToken = !!state.token;

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
        {!isLoading && !hasError && hasToken && (
          <ODataGrid
            title=" "
            endpoint={DELIVERABLE_GATES_ENDPOINT}
            columns={deliverableGateColumns}
            keyField="guid"
            token={token} // Use token from useToken instead of state.token
            onTokenExpired={acquireToken} // Pass the acquireToken function for token refresh
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
        {!isLoading && !hasError && !hasToken && (
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
