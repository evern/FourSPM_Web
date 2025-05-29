import React, { useCallback, useEffect } from 'react';
import { ODataGrid } from '../../components';
import { createProjectColumns } from './project-columns';
import { ProjectsProvider, useProjects } from '../../contexts/projects/projects-context';
import { useProjectGridHandlers } from '../../hooks/grid-handlers/useProjectGridHandlers';
import { PROJECTS_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import { ErrorMessage } from '../../components/error-message/error-message';
import './projects.scss';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';


function Projects(): React.ReactElement {
  return (
    <ProjectsProvider>
      <ProjectsContent />
    </ProjectsProvider>
  );
}


const ProjectsContent = (): React.ReactElement => {

  const { 
    state, 
    clientDataSource,
    clientDataLoaded,
    nextProjectNumber,
    refreshNextNumber
  } = useProjects();


  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  

  useEffect(() => {

    loadPermissions();
  }, [loadPermissions]);
  

  const canEditProjects = useCallback(() => {
    return canEdit(PERMISSIONS.PROJECTS.EDIT.split('.')[0]);
  }, [canEdit]);
  

  useEffect(() => {

    if (!canEditProjects() && !state.loading && !permissionsLoading) {
      showReadOnlyNotification('projects');
    }
  }, [canEditProjects, state.loading, permissionsLoading]);
  

  const { loading, error } = state;
  

  const hasError = Boolean(error);
  
  // Create a consistent title for display and export
  const gridTitle = 'Projects';

  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized,
    resetGridState
  } = useProjectGridHandlers({
    nextProjectNumber,
    refreshNextNumber
  });


  

  React.useEffect(() => {
    const handleFocus = () => {

      resetGridState();
    };
    

    window.addEventListener('focus', handleFocus);
    

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [resetGridState]);
  
  return (
    <div className="projects-container">

      <LoadPanel 
        visible={loading || !clientDataLoaded} 
        message={loading ? 'Loading projects...' : 'Loading client data...'}
        position={{ of: '.projects-grid' }}
      />
      

      {hasError && (
        <ErrorMessage
          title="Error Loading Projects"
          message={error || 'Unable to acquire authentication token. Please try refreshing the page.'}
        />
      )}
      
      <div className="projects-grid">
        <div className="grid-custom-title">{gridTitle}</div>
        

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
            allowAdding={canEditProjects()}
            allowUpdating={canEditProjects()}
            allowDeleting={canEditProjects()}
            title=" "
            exportFileName={gridTitle}
            expand={['Client']}

            defaultSort={[{ selector: 'created', desc: true }]}

            countColumn="guid"
            customGridHeight={900}
          />
        )}
      </div>
    </div>
  );
}

export default Projects;
