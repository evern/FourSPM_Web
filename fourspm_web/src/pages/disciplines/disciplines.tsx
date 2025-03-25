import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useDisciplineController } from '../../hooks/controllers/useDisciplineController';
import { disciplineColumns } from './discipline-columns';
import { useAuth } from '../../contexts/auth';
import './disciplines.scss';

const Disciplines: React.FC = () => {
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Disciplines`;
  
  // Use the enhanced useDisciplineData hook with integrated grid operations and validation
  const { 
    handleRowUpdating, 
    handleRowRemoving,
    handleRowInserting,
    onRowValidating
  } = useDisciplineController(user?.token, {
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete discipline:', error),
    onUpdateError: (error) => console.error('Failed to update discipline:', error)
  });

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      code: '',
      name: ''
    };
  };

  return (
    <div className="disciplines-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Disciplines</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={disciplineColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={onRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default Disciplines;
