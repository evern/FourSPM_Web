import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useAutoIncrement } from '../../hooks/useAutoIncrement';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { clientColumns } from './client-columns';
import { useNavigation } from '../../contexts/navigation';
import './clients.scss';

const Clients: React.FC = () => {
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Clients`;
  const { refreshNavigation } = useNavigation();
  
  const { nextNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'number',
    padLength: 3,
    startFrom: '001'
  });

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete client:', error),
    onDeleteSuccess: refreshNavigation,
    onUpdateSuccess: refreshNavigation,
    onUpdateError: (error) => console.error('Failed to update client:', error)
  });

  const handleRowValidating = useGridValidation([
    { field: 'number', required: true, maxLength: 3, errorText: 'Client Number must be at most 3 characters' },
    { field: 'description', maxLength: 500, errorText: 'Description must be at most 500 characters' },
    { field: 'clientContactName', maxLength: 500, errorText: 'Contact Name must be at most 500 characters' },
    { field: 'clientContactNumber', maxLength: 100, errorText: 'Contact Phone must be at most 100 characters' },
    { 
      field: 'clientContactEmail', 
      maxLength: 100, 
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
      errorText: 'Please enter a valid email address' 
    }
  ]);

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
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
        />
      </div>
    </div>
  );
};

export default Clients;
