import React from 'react';
import { useParams } from 'react-router-dom';
import { useMSALAuth } from '../../contexts/msal-auth';
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
  // Get everything from context including token acquisition
  
  // Use the areas context - now including project data and token
  const {
    state,
    projectId,
    project,
    isLookupDataLoading,
    acquireToken
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
    acquireToken
  });

  // Use the combined loading state from context - prevents flickering
  const isLoading = state.loading;
  
  // Check for errors - account for context errors
  const hasError = !!state.error;
  const hasToken = !!state.token;
  
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
        
        {!isLoading && !hasError && hasToken && (
          <ODataGrid
            title=" "
            endpoint={AREAS_ENDPOINT}
            columns={areaColumns}
            keyField="guid"
            token={state.token!} // We already checked hasToken
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
        {!isLoading && !hasError && !hasToken && (
          <ErrorMessage
            title="Authentication Error"
            message="Unable to acquire authentication token. Please try refreshing the page."
          />
        )}
      </div>
      <ScrollToTop />
    </div>
  );
});

// Export Areas component as default export
export default Areas;
