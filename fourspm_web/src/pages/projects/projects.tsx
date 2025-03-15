import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useAutoIncrement } from '../../hooks/useAutoIncrement';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { projectColumns } from './project-columns';
import { useNavigation } from '../../contexts/navigation';
import './projects.scss';

const Projects: React.FC = () => {
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Projects`;
  const { refreshNavigation } = useNavigation();
  
  const { nextNumber: nextProjectNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'projectNumber'
  });

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete project:', error),
    onDeleteSuccess: refreshNavigation,
    onUpdateSuccess: () => {
      console.log('Project updated successfully');
      refreshNavigation();
    },
    onUpdateError: (error) => console.error('Failed to update project:', error),
    onInsertSuccess: () => {
      console.log('Project inserted successfully');
      refreshNavigation();
    },
    onInsertError: (error) => console.error('Failed to insert project:', error)
  });

  const handleRowValidating = useGridValidation([
    { field: 'projectNumber', required: true, maxLength: 2, errorText: 'Project Number must be at most 2 characters' },
    { field: 'name', required: true, maxLength: 200, errorText: 'Project Name is required and must be at most 200 characters' },
    { field: 'clientGuid', required: true, errorText: 'Client is required' }
  ]);

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectNumber: nextProjectNumber,
      projectStatus: 'TenderInProgress' // Default status
    };
    refreshNextNumber();
  };

  return (
    <React.Fragment>
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
        <div className="bottom-spacer"></div>
    </React.Fragment>
  );
};

export default Projects;
