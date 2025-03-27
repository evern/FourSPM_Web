import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/auth';
import { useProjectCollectionController } from '../../hooks/controllers/useProjectCollectionController';
import { projectColumns } from './project-columns';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { LoadPanel } from 'devextreme-react/load-panel';
import { useNavigation } from '../../contexts/navigation';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import './projects.scss';

/**
 * Projects Grid Page Component
 * 
 * Uses a hybrid approach for data access:
 * - ODataStore for grid data binding (efficient remote operations)
 * - Data providers for consistent access pattern
 */
const Projects: React.FC = () => {
  const endpoint = PROJECTS_ENDPOINT;
  const { refreshNavigation } = useNavigation();

  // Use the collection controller to get the clientsStore
  const { 
    clientsStore,
    handleInitNewRow, 
    handleRowValidating: validateRow, 
    handleRowUpdating, 
    handleRowRemoving, 
    refreshNextNumber
  } = useProjectCollectionController(
    {
      endpoint,
      onInsertSuccess: () => refreshNavigation(),
      onUpdateSuccess: () => refreshNavigation(),
      onDeleteSuccess: () => refreshNavigation()
    }
  );

  // Call refresh when component mounts
  useEffect(() => {
    refreshNextNumber();
  }, [refreshNextNumber]);

  return (
    <div className="projects-container">
      <div className="projects-grid">
        <div className="grid-custom-title">Projects</div>
        <ODataGrid
          endpoint={endpoint}
          columns={projectColumns(clientsStore)} // Only pass the store now
          onInitNewRow={handleInitNewRow}
          onRowValidating={validateRow}
          onRowUpdating={handleRowUpdating}
          onRowRemoving={handleRowRemoving}
          allowAdding={true}
          allowUpdating={true}
          allowDeleting={true}
          title=" "
          keyField="guid"
          expand={['Client']} 
        />
      </div>
    </div>
  );
};

export default Projects;
export { Projects };
