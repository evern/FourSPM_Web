import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { areaColumns } from './area-columns';
import { useAuth } from '../../contexts/auth';
import ScrollToTop from '../../components/scroll-to-top';
import { v4 as uuidv4 } from 'uuid';
import { useAutoIncrement } from '../../hooks/utils/useAutoIncrement';
import { useAreaControllerWithProject } from '../../hooks/controllers/useAreaController';
import './areas.scss';

interface AreaParams {
  projectId: string;
}

const Areas: React.FC = () => {
  const { projectId } = useParams<AreaParams>();
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Areas`;

  // Project filter used for both grid and auto-increment
  // Using proper type annotation to satisfy TypeScript
  const projectFilter: [string, string, any][] = [["projectGuid", "=", projectId]];
  
  console.log('Areas Component - Rendering with projectId:', projectId);

  // Add auto-increment hook to get the next area number
  const { nextNumber: nextAreaNumber, refreshNextNumber } = useAutoIncrement({
    endpoint,
    field: 'number',
    padLength: 2,
    startFrom: '01',
    filter: `projectGuid eq ${projectId}`
  });

  // Use the enhanced area controller with project-specific functionality
  const { 
    handleRowUpdating, 
    handleRowRemoving, 
    handleRowInserting,
    onRowValidating,
    handleGridInitialized,
    project
  } = useAreaControllerWithProject(
    user?.token,
    projectId,
    {
      endpoint,
      onDeleteError: (error) => console.error('Failed to delete area:', error),
      onUpdateError: (error) => console.error('Failed to update area:', error),
      onDeleteSuccess: refreshNextNumber,
      onUpdateSuccess: refreshNextNumber,
      onInsertSuccess: refreshNextNumber
    }
  );

  const handleInitNewRow = useCallback((e: any) => {
    e.data = {
      guid: uuidv4(),
      projectGuid: projectId,
      number: nextAreaNumber,
      description: ''
    };
  }, [projectId, nextAreaNumber]);

  return (
    <div className="areas-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Areas` : 'Areas'}
        </div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={areaColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={onRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
          onInitialized={handleGridInitialized}
          defaultFilter={projectFilter}
        />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Areas;
