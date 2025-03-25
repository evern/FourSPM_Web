import React from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createDeliverableColumns } from './deliverable-columns';
import { useAuth } from '../../contexts/auth';
import ScrollToTop from '../../components/scroll-to-top';
import { useDeliverableControllerWithProject } from '../../hooks/controllers/useDeliverableController';
import './deliverables.scss';

interface DeliverableParams {
  projectId: string;
}

const Deliverables: React.FC = () => {
  const { projectId } = useParams<DeliverableParams>();
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Deliverables`;

  // Use the enhanced controller with project-specific functionality
  const {
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting,
    onRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    handleGridInitialized,
    project
  } = useDeliverableControllerWithProject(
    user?.token,
    projectId,
    {
      endpoint,
      onDeleteError: (error) => console.error('Failed to delete deliverable:', error),
      onUpdateError: (error) => console.error('Failed to update deliverable:', error)
    }
  );

  // Create columns with the current projectId to filter areas
  const columns = createDeliverableColumns(projectId);

  return (
    <div className="deliverables-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables'}</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={columns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={onRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
          onEditorPreparing={handleEditorPreparing}
          onInitialized={handleGridInitialized}
          defaultFilter={[['projectGuid', '=', projectId]]}
        />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Deliverables;
