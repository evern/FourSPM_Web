import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { disciplineColumns } from './discipline-columns';
import { useAuth } from '../../contexts/auth';
import './disciplines.scss';

const Disciplines: React.FC = () => {
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Disciplines`;
  
  console.log('Disciplines Component - Initial Render:', {
    endpoint,
    hasToken: !!user?.token
  });

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete discipline:', error),
    onUpdateError: (error) => console.error('Failed to update discipline:', error)
  });

  const handleRowValidating = useGridValidation([
    { 
      field: 'code', 
      required: true, 
      maxLength: 2,
      pattern: /^[A-Z][A-Z]$/,
      errorText: 'Code must be exactly 2 uppercase letters' 
    },
    { 
      field: 'name', 
      required: false, 
      maxLength: 500,
      errorText: 'Name cannot exceed 500 characters' 
    }
  ]);

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
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
        />
      </div>
    </div>
  );
};

export default Disciplines;
