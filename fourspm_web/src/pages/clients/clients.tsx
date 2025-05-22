import React from 'react';
import { ErrorMessage } from '@/components';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { clientColumns } from './client-columns';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';
import './clients.scss';
import { ClientsProvider, useClients } from '../../contexts/clients/clients-context';
import { useToken } from '../../contexts/token-context';
import { useClientGridHandlers } from '@/hooks/grid-handlers/useClientGridHandlers';
import { LoadPanel } from 'devextreme-react/load-panel';

// Main Clients component following the Collection View Doctrine
const Clients: React.FC = () => {
  return (
    <ClientsProvider>
      <ClientsContent />
    </ClientsProvider>
  );
};

const ClientsContent = React.memo((): React.ReactElement => {
  // Get state from context and token from useToken
  const { state } = useClients();
  const { token, acquireToken } = useToken();
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useClientGridHandlers();

  // Loading and error states from context (which now comes from useTokenAcquisition)
  const isLoading = state.loading;
  const hasError = !!state.error;

  return (
    <div className="clients-container">
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
          title="Error Loading Clients"
          message={state.error || 'An unknown error occurred'}
        />
      )}
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Clients</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
            endpoint={CLIENTS_ENDPOINT}
            columns={clientColumns}
            keyField="guid"
            token={token} // Use token from useToken instead of state.token
            onTokenExpired={acquireToken} // Pass the acquireToken function for token refresh
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onInitialized={handleGridInitialized}
            defaultSort={[{ selector: 'number', desc: false }]}
            customGridHeight={900}
          />
        )}
      </div>
    </div>
  );
});

export default Clients;
