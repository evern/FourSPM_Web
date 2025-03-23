import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createDeliverableColumns } from './deliverable-columns';
import { useAuth } from '../../contexts/auth';
import { fetchProject } from '../../services/project.service';
import { ProjectInfo } from '../../types/project';
import { useDeliverablesHandlers } from './deliverables.handlers';
import ScrollToTop from '../../components/scroll-to-top';
import './deliverables.scss';

interface DeliverableParams {
  projectId: string;
}

const Deliverables: React.FC = () => {
  const { projectId } = useParams<DeliverableParams>();
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Deliverables`;
  const [gridInstance, setGridInstance] = useState<any>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  // Get all the grid handlers from our custom hook
  const {
    handleRowUpdating,
    handleRowRemoving,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    handleGridInitialized
  } = useDeliverablesHandlers({
    projectId: projectId || '',
    endpoint,
    userToken: user?.token,
    gridInstance,
    setGridInstance
  });

  // Fetch project info when component mounts
  useEffect(() => {
    const getProjectInfo = async () => {
      if (!user?.token || !projectId) return;
      
      try {
        const project = await fetchProject(projectId, user.token);
        setProjectInfo(project);
      } catch (error) {
        console.error('Error fetching project info:', error);
      }
    };
    
    getProjectInfo();
  }, [projectId, user?.token]);

  // Create columns with the current projectId to filter areas
  const columns = createDeliverableColumns(projectId);

  return (
    <div className="deliverables-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{projectInfo ? `${projectInfo.projectNumber} - ${projectInfo.name} Deliverables` : 'Deliverables'}</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={columns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onEditorPreparing={handleEditorPreparing}
          onInitialized={handleGridInitialized}
          defaultFilter={[["projectGuid", "=", projectId]]}
        />
      </div>
    </div>
  );
};

export default Deliverables;
