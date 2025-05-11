import React from 'react';
import { ODataGrid } from '../../components';
import { clientColumns } from './client-columns';
import { useAuth } from '../../contexts/auth';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';
import './clients.scss';
import { ClientsProvider, useClients } from '@/contexts/clients/clients-context';
import { useClientGridHandlers } from '@/hooks/grid-handlers/useClientGridHandlers';
import { LoadPanel } from 'devextreme-react/load-panel';
import { ErrorMessage } from '@/components';

// Main Clients component following the Collection View Doctrine
const Clients: React.FC = () => {
  return (
    <ClientsProvider>
      <ClientsContent />
    </ClientsProvider>
  );
};

const ClientsContent = React.memo((): React.ReactElement => {
  const { user } = useAuth();
  const { state } = useClients();
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useClientGridHandlers({ userToken: user?.token });

  // For demonstration, assume loading/error state comes from context only
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
