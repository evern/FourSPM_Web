import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { ODataGrid } from '../../components';
import { areaColumns } from './area-columns';
import { AREAS_ENDPOINT } from '@/config/api-endpoints';
import { ScrollToTop } from '../../components';
// Removed useProjectInfo import as we now get project from context
import { LoadPanel } from 'devextreme-react/load-panel';
import './areas.scss';
import { AreasProvider, useAreas } from '@/contexts/areas/areas-context';
import { useAreaGridHandlers } from '@/hooks/grid-handlers/useAreaGridHandlers';
import { ErrorMessage } from '@/components';

interface AreaParams {
  projectId: string;
}

/**
 * Main Areas component following the Collection View Doctrine
 */
function Areas(): React.ReactElement {
  // Extract project ID from URL params
  const { projectId } = useParams<AreaParams>();
  
  // Validate projectId exists
  if (!projectId) {
    return <div className="error-message">Project ID is missing from the URL.</div>;
  }
  
  return (
    <AreasProvider projectId={projectId}>
      <AreasContent />
    </AreasProvider>
  );
}

/**
 * Internal component that uses the areas context
 */
const AreasContent = React.memo((): React.ReactElement => {
  // Get user auth token for API calls
  const { user } = useAuth();
  
  // Use the areas context - now including project data
  const {
    state,
    projectId,
    project,
    isLookupDataLoading
  } = useAreas();

  // Define filter to only show areas for the current project
  const projectFilter: [string, string, any][] = [["projectGuid", "=", projectId]];
  
  // Use the dedicated grid handlers hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useAreaGridHandlers({
    userToken: user?.token
  });

  // Use the combined loading state from context - prevents flickering
  const isLoading = isLookupDataLoading;
  
  // Check for errors - account for context errors
  const hasError = state.error !== null;
  
  return (
    <div className="areas-container">
      {/* Loading indicator */}
      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={isLoading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      
      {/* Error message */}
      {hasError && (
        <ErrorMessage
          title="Error Loading Areas"
          message={state.error || 'An unknown error occurred'}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Areas` : 'Areas'}
        </div>
        
        {!isLoading && !hasError && (
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
            onInitialized={handleGridInitialized}
            defaultFilter={projectFilter}
            defaultSort={[{ selector: 'areaNumber', desc: false }]}
            customGridHeight={900}
            countColumn="guid"
          />
        )}
      </div>
      <ScrollToTop />
    </div>
  );
});

// Export Areas component as default export
export default Areas;
