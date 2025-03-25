import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useAutoIncrement } from '../../hooks/utils/useAutoIncrement';
import { useProjectController } from '../../hooks/controllers/useProjectController';
import { projectColumns } from './project-columns';
import { useNavigation } from '../../contexts/navigation';
import './projects.scss';

const Projects: React.FC = () => {
  // Use the standard endpoint without $expand parameter
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Projects`;
  const { refreshNavigation } = useNavigation();
  
  const { nextNumber: nextProjectNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'projectNumber',
    padLength: 2,
    startFrom: '01'
  });

  // Get user token from local storage
  const userToken = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user') || '{}').token 
    : null;

  // Use the project data hook which handles grid operations
  const { 
    handleRowUpdating, 
    handleRowRemoving, 
    onRowValidating
  } = useProjectController(
    userToken,
    {
      endpoint,
      onDeleteError: (error) => console.error('Failed to delete project:', error),
      onDeleteSuccess: () => {
        refreshNextNumber();
        refreshNavigation();
      },
      onUpdateSuccess: () => {
        refreshNextNumber();
        refreshNavigation();
      },
      onUpdateError: (error) => console.error('Failed to update project:', error),
      onInsertSuccess: () => {
        refreshNextNumber();
        refreshNavigation();
      },
      onInsertError: (error) => console.error('Failed to insert project:', error)
    }
  );

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectNumber: nextProjectNumber,
      projectStatus: 'TenderInProgress' // Default status
    };
  };

  return (
    <div className="projects-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Projects</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={projectColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={onRowValidating}
          onRowRemoving={handleRowRemoving}
          expand={['Client']} // Use the expand property we added to ODataGrid
        />
      </div>
    </div>
  );
};

export default Projects;
