import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useAutoIncrement } from '../../hooks/useAutoIncrement';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { projectColumns } from './project-columns';

const Projects: React.FC = () => {
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Projects`;
  
  const { nextNumber: nextProjectNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'projectNumber'
  });

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete project:', error)
  });

  const handleRowValidating = useGridValidation([
    { field: 'clientNumber', required: true, maxLength: 3, errorText: 'Client Number must be at most 3 characters' },
    { field: 'projectNumber', required: true, maxLength: 2, errorText: 'Project Number must be at most 2 characters' }
  ]);

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectNumber: nextProjectNumber
    };
    refreshNextNumber();
  };

  return (
    <ODataGrid
      title="Projects"
      endpoint={endpoint}
      columns={projectColumns}
      keyField="guid"
      onRowUpdating={handleRowUpdating}
      onInitNewRow={handleInitNewRow}
      onRowValidating={handleRowValidating}
      onRowRemoving={handleRowRemoving}
    />
  );
};

export default Projects;
