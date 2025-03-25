import React, { useMemo } from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useAutoIncrement } from '../../hooks/utils/useAutoIncrement';
import { useClientController } from '../../hooks/controllers/useClientController';
import { clientColumns } from './client-columns';
import { useNavigation } from '../../contexts/navigation';
import { useAuth } from '../../contexts/auth';
import './clients.scss';

const Clients: React.FC = () => {
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Clients`;
  const { refreshNavigation } = useNavigation();
  const { user } = useAuth();
  
  const { nextNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'number',
    padLength: 3,
    startFrom: '001'
  });

  const { 
    handleRowUpdating, 
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating
  } = useClientController(user?.token, {
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete client:', error),
    onDeleteSuccess: refreshNavigation,
    onUpdateSuccess: refreshNavigation,
    onUpdateError: (error) => console.error('Failed to update client:', error),
    onInsertSuccess: refreshNavigation
  });

  // Create the validation function by calling handleRowValidating with an empty array
  // since the validation rules are already provided in useClientData
  const rowValidatingHandler = useMemo(() => {
    return handleRowValidating([]);
  }, [handleRowValidating]);

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      number: nextNumber
    };
    refreshNextNumber();
  };

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
          onRowValidating={rowValidatingHandler}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default Clients;
