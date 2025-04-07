import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createProjectColumns } from './project-columns';
import { useProjects } from '../../contexts/projects/projects-context';
import { useClientDataSource } from '../../stores/clientDataSource';
import { useProjectGridHandlers } from '../../hooks/data-providers/useProjectGridHandlers';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import { useAutoIncrement } from '../../hooks/utils/useAutoIncrement';
import './projects.scss';

/**
 * Projects component
 * 
 * Uses the Context + Reducer pattern for clean separation of view and logic.
 * This component focuses purely on rendering and delegating events to the context.
 */
export function Projects(): React.ReactElement {
  // Get everything we need from the projects context
  const { 
    state, 
    validateProject
  } = useProjects();
  
  // Use the singleton client data source with loading tracking
  const clientsDataSource = useClientDataSource();
  const [clientDataLoaded, setClientDataLoaded] = useState(false);
  
  // Use auto-increment for project number
  const { nextNumber: nextProjectNumber, refreshNextNumber } = useAutoIncrement({
    endpoint: PROJECTS_ENDPOINT,
    field: 'projectNumber',
    padLength: 2,
    startFrom: '01'
  });
  
  // Get the grid event handlers from our custom hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow
  } = useProjectGridHandlers({
    validateProject,
    nextProjectNumber,
    refreshNextNumber
  });

  // Wait for client data to load before initializing the grid
  useEffect(() => {
    clientsDataSource.waitForData()
      .then(() => setClientDataLoaded(true))
      .catch(() => setClientDataLoaded(true)); // Allow UI to proceed even on error
  }, [clientsDataSource]);
  


  return (
    <div className="projects-container">
      {/* Display error message if there is one */}
      {state.error && (
        <div className="alert alert-danger">
          Error: {state.error}
        </div>
      )}
      
      {/* Loading indicators */}
      <LoadPanel 
        visible={state.loading || !clientDataLoaded} 
        message={state.loading ? 'Loading projects...' : 'Loading client data...'}
        position={{ of: '.projects-grid' }}
      />
      
      <div className="projects-grid">
        <div className="grid-custom-title">Projects</div>
        
        {/* Only render the grid once client data is loaded */}
        {clientDataLoaded && (
          <ODataGrid
            endpoint={PROJECTS_ENDPOINT}
            columns={createProjectColumns(clientsDataSource, nextProjectNumber)}
            onRowValidating={handleRowValidating}
            onRowUpdating={handleRowUpdating}
            onRowInserting={handleRowInserting} 
            onRowRemoving={handleRowRemoving}
            onInitNewRow={handleInitNewRow}
            keyField="guid"
            allowAdding={true}
            allowUpdating={true}
            allowDeleting={true}
            title=" "
            expand={['Client']}
            // Add default sort to ensure consistent query parameters
            defaultSort={[{ selector: 'created', desc: true }]}
          />
        )}
      </div>
    </div>
  );
}

export default Projects;
