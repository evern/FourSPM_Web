import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useVariationCollectionController } from '../../hooks/controllers/useVariationCollectionController';
import { variationColumns } from './variation-columns';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import ScrollToTop from '../../components/scroll-to-top';
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import './variations.scss';

interface VariationParams {
  projectId: string;
}

const Variations: React.FC = () => {
  const { projectId } = useParams<VariationParams>();
  const { user } = useAuth();

  // Fetch project info directly
  const { project } = useProjectInfo(projectId, user?.token);

  // Create project filter for grid
  const projectFilter: [string, string, any][] = [['projectGuid', '=', projectId]];
  
  // Use the controller with data provider pattern
  const { 
    handleRowUpdating, 
    handleRowRemoving, 
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing
  } = useVariationCollectionController(
    user?.token,
    projectId,
    { 
      onDeleteError: (error) => console.error('Failed to delete variation:', error),
      onUpdateError: (error) => console.error('Failed to update variation:', error),
      onDeleteSuccess: () => console.log('Variation deleted successfully'),
      onUpdateSuccess: () => console.log('Variation updated successfully'),
      onInsertSuccess: () => console.log('Variation created successfully')
    }
  );

  return (
    <div className="variations-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Variations` : 'Variations'}
        </div>
        <ODataGrid
          title=" "
          endpoint={VARIATIONS_ENDPOINT}
          columns={variationColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
          onEditorPreparing={handleEditorPreparing}
          defaultFilter={projectFilter}
        />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Variations;
