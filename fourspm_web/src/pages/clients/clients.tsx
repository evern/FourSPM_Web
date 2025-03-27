import React from 'react';
import { API_CONFIG } from '../../config/api';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useClientCollectionController } from '../../hooks/controllers/useClientCollectionController';
import { clientColumns } from './client-columns';
import { useAuth } from '../../contexts/auth';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';
import './clients.scss';

const Clients: React.FC = () => {
  const endpoint = CLIENTS_ENDPOINT;
  const { user } = useAuth();
  
  const { 
    handleRowUpdating, 
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    refreshNextNumber
  } = useClientCollectionController(user?.token, {
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete client:', error),
    onUpdateError: (error) => console.error('Failed to update client:', error),
    onDeleteSuccess: () => refreshNextNumber(),
    onUpdateSuccess: () => refreshNextNumber(),
    onInsertSuccess: () => refreshNextNumber()
  });

  return (
    <div className="clients-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Clients</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={clientColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default Clients;
