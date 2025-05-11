import React from 'react';
import { ODataGrid } from '../../components';
import { createProjectColumns } from './project-columns';
import { useProjects, ProjectsProvider } from '../../contexts/projects/projects-context';
import { useProjectGridHandlers } from '../../hooks/grid-handlers/useProjectGridHandlers';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import { useAuth } from '../../contexts/auth';
import './projects.scss';

/**
 * Projects component
 * 
 * Uses the Context + Reducer pattern for clean separation of view and logic.
 * This component follows the same pattern as other modules like DeliverableProgress.
 */
function Projects(): React.ReactElement {
  return (
    <ProjectsProvider>
      <ProjectsContent />
    </ProjectsProvider>
  );
}

/**
 * Internal component that consumes the context
 * Focuses purely on rendering and delegating events to the context
 */
const ProjectsContent = (): React.ReactElement => {
  // Get everything we need from the projects context and auth
  const { 
    state, 
    clientDataSource,
    clientDataLoaded,
    nextProjectNumber,
    refreshNextNumber
  } = useProjects();
  const { user } = useAuth();
  
  // Get the grid event handlers from our custom hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized, // Grid initialization handler
    resetGridState       // Reset grid state for virtual scrolling
  } = useProjectGridHandlers({
    nextProjectNumber,
    refreshNextNumber,
    userToken: user?.token // Pass user token from auth context for API calls if needed
  });

  // Client data loading is now handled by the context
  
  // Set up window focus handler to reset grid state when switching tabs
  React.useEffect(() => {
    const handleFocus = () => {
      // Reset grid state when switching back to this tab
      resetGridState();
    };
    
    // Add event listener
    window.addEventListener('focus', handleFocus);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [resetGridState]);
  
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
            columns={createProjectColumns(clientDataSource, nextProjectNumber)}
            onRowValidating={handleRowValidating}
            onRowUpdating={handleRowUpdating}
            onRowInserting={handleRowInserting} 
            onRowRemoving={handleRowRemoving}
            onInitNewRow={handleInitNewRow}
            onInitialized={handleGridInitialized}
            keyField="guid"
            allowAdding={true}
            allowUpdating={true}
            allowDeleting={true}
            title=" "
            expand={['Client']}
            // Add default sort to ensure consistent query parameters
            defaultSort={[{ selector: 'created', desc: true }]}
            // Set countColumn for proper record counting - memory #96c469d2
            countColumn="guid"
          />
        )}
      </div>
    </div>
  );
}

export default Projects;
