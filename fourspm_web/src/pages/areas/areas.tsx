import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useAreaCollectionController } from '../../hooks/controllers/useAreaCollectionController';
import { areaColumns } from './area-columns';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';
import ScrollToTop from '../../components/scroll-to-top';
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import './areas.scss';

interface AreaParams {
  projectId: string;
}

const Areas: React.FC = () => {
  const { projectId } = useParams<AreaParams>();
  const { user } = useAuth();

  // Fetch project info directly
  const { project } = useProjectInfo(projectId, user?.token);

  const projectFilter: [string, string, any][] = [["projectGuid", "=", projectId]];
  
  // Use the updated controller with data provider pattern
  const { 
    handleRowUpdating, 
    handleRowRemoving, 
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    refreshNextNumber
  } = useAreaCollectionController(
    projectId,
    { // Pass a config object instead of a token
      onDeleteError: (error) => console.error('Failed to delete area:', error),
      onUpdateError: (error) => console.error('Failed to update area:', error),
      onDeleteSuccess: () => refreshNextNumber(),
      onUpdateSuccess: () => refreshNextNumber(),
      onInsertSuccess: () => refreshNextNumber()
    }
  );

  return (
    <div className="areas-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Areas` : 'Areas'}
        </div>
        <ODataGrid
          title=" "
          endpoint={AREAS_ENDPOINT}
          columns={areaColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
          defaultFilter={projectFilter}
        />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Areas;
