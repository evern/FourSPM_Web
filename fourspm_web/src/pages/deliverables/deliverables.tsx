import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createDeliverableColumns } from './deliverable-columns';
import ScrollToTop from '../../components/scroll-to-top';
import './deliverables.scss';
import { DELIVERABLES_ENDPOINT, PROJECTS_ENDPOINT } from '@/config/api-endpoints';
import { useScreenSizeClass } from '../../utils/media-query';
import { LoadPanel } from 'devextreme-react/load-panel';
import { useDeliverableGridHandlers } from '@/hooks/grid-handlers/useDeliverableGridHandlers';
import { useAuth } from '@/contexts/auth';
import { useProjectData } from '@/hooks/queries/useProjectData';
import { useDeliverablesQuery } from '@/hooks/queries/useDeliverablesQuery';
import { useQuery } from '@tanstack/react-query';
import { baseApiService } from '@/api/base-api.service';

interface DeliverableParams {
  projectId: string;
}

/**
 * Fetch project details from the API
 * @param projectId Project ID to fetch details for
 */
const fetchProject = async (projectId: string) => {
  if (!projectId) return null;
  
  const response = await baseApiService.request(`${PROJECTS_ENDPOINT}(${projectId})`);
  const data = await response.json();
  return data;
};

/**
 * Main Deliverables component refactored to use React Query
 */
export function Deliverables(): React.ReactElement {
  // Extract project ID from URL params
  const { projectId } = useParams<DeliverableParams>();
  
  // Validate projectId exists
  if (!projectId) {
    return <div className="error-message">Project ID is missing from the URL.</div>;
  }
  
  return <DeliverablesContent projectId={projectId} />;
}

interface DeliverablesContentProps {
  projectId: string;
}

/**
 * Internal component that uses React Query hooks for data fetching
 */
const DeliverablesContent = React.memo(({ projectId }: DeliverablesContentProps): React.ReactElement => {
  // Get user auth token for API calls
  const { user } = useAuth();
  
  // Use the consolidated project data hook to fetch all reference data
  const { 
    areasDataSource, 
    disciplinesDataSource, 
    documentTypesDataSource,
    isLoading: referenceDataLoading, 
    error: referenceDataError 
  } = useProjectData(projectId);
  
  // Fetch project details
  const { 
    data: project, 
    isLoading: projectLoading,
    error: projectError
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId
  });
  
  // Fetch deliverables data
  const {
    data: deliverables = [],
    isLoading: deliverablesLoading,
    error: deliverablesError
  } = useDeliverablesQuery(projectId);
  
  // Get grid handlers directly from the hook
  const {
    handleGridInitialized,
    handleRowUpdating,
    handleRowInserting,
    handleRowValidating,
    handleRowRemoving,
    handleInitNewRow,
    handleEditorPreparing
  } = useDeliverableGridHandlers({
    projectGuid: projectId,
    userToken: user?.token,
    project
  });
  

  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Determine if we're still loading any data
  const isLoading = referenceDataLoading || projectLoading || deliverablesLoading;
  const error = referenceDataError || projectError || deliverablesError;
  
  // Create columns with the lookup data sources from dedicated providers
  const columns = useMemo(() => {
    // Only create columns when lookup data is ready
    if (isLoading || !areasDataSource || !disciplinesDataSource || !documentTypesDataSource) {
      return [];
    }
    
    return createDeliverableColumns(areasDataSource, disciplinesDataSource, documentTypesDataSource);
  }, [areasDataSource, disciplinesDataSource, documentTypesDataSource, isLoading]);
  
  // Adjust columns for mobile size if needed
  const mobileAdjustedColumns = useMemo(() => {
    return isMobile 
      ? columns.filter(c => c.dataField !== 'description') // Example: Hide description on mobile
      : columns;
  }, [columns, isMobile]);
  
  // Show error if one occurred
  if (error) {
    return <div className="error-message">Error loading data: {error.message}</div>;
  }
  
  return (
    <div className="deliverables-container">
      {/* Loading indicator */}
      <LoadPanel
        visible={isLoading}
        message={projectLoading ? 'Loading project details...' : 'Loading reference data...'}
        position={{ of: '.deliverables-container' }}
        shadingColor="rgba(0,0,0,0.1)"
        showIndicator={true}
        showPane={true}
        shading={true}
      />
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables'}
        </div>
        
        {!isLoading && (
          <ODataGrid
            title=" "
            endpoint={DELIVERABLES_ENDPOINT}
            columns={mobileAdjustedColumns}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onEditorPreparing={handleEditorPreparing}
            onInitialized={handleGridInitialized}
            defaultFilter={[["projectGuid", "=", projectId]]}
            countColumn="guid"
            defaultSort={[{ selector: 'internalDocumentNumber', desc: false }]}
            allowAdding={true}
            allowUpdating={true}
            allowDeleting={true}
            customGridHeight={900}
          />
        )}
      </div>
      <ScrollToTop />
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if projectId changes
  return prevProps.projectId === nextProps.projectId;
});

export default Deliverables;