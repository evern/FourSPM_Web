import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { useAutoIncrement } from '../../hooks/useAutoIncrement';
import { areaColumns } from './area-columns';
import { useAuth } from '../../contexts/auth';
import { fetchProject } from '../../services/project.service';
import { ProjectInfo } from '../../types/project';
import './areas.scss';

interface AreaParams {
  projectId: string;
}

const Areas: React.FC = () => {
  const { projectId } = useParams<AreaParams>();
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Areas`;
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  
  console.log('Areas Component - Initial Render:', {
    projectId,
    endpoint,
    hasToken: !!user?.token
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

  // Project filter used for both grid and auto-increment
  // Using proper type annotation to satisfy TypeScript
  const projectFilter: [string, string, any][] = [["projectGuid", "=", projectId]];

  // Add auto-increment hook to get the next area number
  const { nextNumber: nextAreaNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'number',
    padLength: 2,
    startFrom: '01',
    filter: projectFilter
  });

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete area:', error),
    onUpdateError: (error) => console.error('Failed to update area:', error),
    onDeleteSuccess: refreshNextNumber,
    onUpdateSuccess: refreshNextNumber,
    onInsertSuccess: refreshNextNumber
  });

  const handleRowValidating = useGridValidation([
    { 
      field: 'number', 
      required: true, 
      maxLength: 2,
      pattern: /^[0-9][0-9]$/,
      errorText: 'Area Number must be exactly 2 digits (00-99)' 
    },
    { 
      field: 'description', 
      required: true,
      maxLength: 500,
      errorText: 'Area Description is required' 
    }
  ]);

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectGuid: projectId,
      number: nextAreaNumber, // Use the auto-incremented number
      description: ''
    };
  };

  return (
    <div className="areas-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{projectInfo ? `${projectInfo.projectNumber} - ${projectInfo.name} Areas` : 'Areas'}</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={areaColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          defaultFilter={projectFilter}
        />
      </div>
    </div>
  );
};

export default Areas;
