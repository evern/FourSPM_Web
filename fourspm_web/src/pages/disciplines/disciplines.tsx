import React from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useDisciplineCollectionController } from '../../hooks/controllers/useDisciplineCollectionController';
import { disciplineColumns } from './discipline-columns';
import { useAuth } from '../../contexts/auth';
import { DISCIPLINES_ENDPOINT } from '@/config/api-endpoints';
import './disciplines.scss';

const Disciplines: React.FC = () => {
  const { user } = useAuth();
  const endpoint = DISCIPLINES_ENDPOINT;
  
  // Use the enhanced useDisciplineData hook with integrated grid operations and validation
  const { 
    handleRowUpdating, 
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow
  } = useDisciplineCollectionController(user?.token, {
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete discipline:', error),
    onUpdateError: (error) => console.error('Failed to update discipline:', error)
  });

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
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default Disciplines;
