import React, { useCallback, useEffect } from 'react';
import { ErrorMessage } from '@/components';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { clientColumns } from './client-columns';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';
import './clients.scss';
import { ClientsProvider, useClients } from '../../contexts/clients/clients-context';
import { useClientGridHandlers } from '@/hooks/grid-handlers/useClientGridHandlers';
import { LoadPanel } from 'devextreme-react/load-panel';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { withPermissionCheck, showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';
import { GRID_STATE_CLIENTS } from '../../utils/grid-state-keys';

// Main Clients component following the Collection View Doctrine
const Clients: React.FC = () => {
  return (
    <ClientsProvider>
      <ClientsContent />
    </ClientsProvider>
  );
};

const ClientsContent = React.memo((): React.ReactElement => {
  // Get state from context and token directly from token-store
  const { state } = useClients();
  
  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check client edit permissions
  const canEditClients = useCallback(() => {
    return canEdit(PERMISSIONS.CLIENTS.EDIT.split('.')[0]); // Extract 'clients' from 'clients.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditClients() && !state.loading && !permissionsLoading) {
      showReadOnlyNotification('clients');
    }
  }, [canEditClients, state.loading, permissionsLoading]);
  
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

  // Create a consistent title for display and export
  const gridTitle = 'Clients';

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
        <div className="grid-custom-title">{gridTitle}</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
            exportFileName={gridTitle}
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
            allowAdding={canEditClients()}
            allowUpdating={canEditClients()}
            allowDeleting={canEditClients()}
            stateStorageKey={GRID_STATE_CLIENTS}
            stateStoring={{ enabled: true }}
            allowGrouping={true}
            showGroupPanel={true}
          />
        )}
      </div>
    </div>
  );
});

export default Clients;
