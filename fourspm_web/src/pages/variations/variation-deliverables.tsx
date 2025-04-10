import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { ODataGrid, ODataGridColumn } from '@/components/ODataGrid/ODataGrid';
import { createVariationDeliverableColumns, processVariationDeliverableColumns } from './variation-deliverable-columns';
import ScrollToTop from '@/components/scroll-to-top/scroll-to-top';
import './variation-deliverables.scss';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

// Import data providers directly instead of from context
import { useAreaDataProvider } from '@/hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '@/hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '@/hooks/data-providers/useDocumentTypeDataProvider';
import { useVariationInfo } from '@/hooks/utils/useVariationInfo';
import { useProjectInfo } from '@/hooks/utils/useProjectInfo';
import { useScreenSizeClass } from '@/utils/media-query';

// Import grid handlers
import { useVariationDeliverableGridHandlers } from '@/hooks/grid-handlers/useVariationDeliverableGridHandlers';

// Import context provider that's still needed for grid handlers
import { VariationDeliverablesProvider } from '@/contexts/variation-deliverables/variation-deliverables-context';

// Import API endpoints
import { VARIATION_DELIVERABLES_ENDPOINT, getVariationDeliverablesWithParamUrl } from '@/config/api-endpoints';

// Type definition for route parameters
interface VariationDeliverableParams {
  variationId: string;
  // We don't use projectId from URL as it's not available
}

/**
 * Main component for variation deliverables
 * Following the pattern from deliverables.tsx for direct data provider usage
 * but we still need the context provider for useVariationDeliverableGridHandlers
 */
export function VariationDeliverablesFinal(): React.ReactElement {
  // Get route parameters
  const { variationId } = useParams<VariationDeliverableParams>();
  
  // We still need the context provider for useVariationDeliverableGridHandlers
  return (
    <VariationDeliverablesProvider variationId={variationId}>
      <VariationDeliverablesContent />
    </VariationDeliverablesProvider>
  );
}

/**
 * Main content component that handles data providers and UI
 * Follows the pattern from deliverables.tsx with direct data provider usage
 */
const VariationDeliverablesContent = (): React.ReactElement => {
  // Get authentication token and screen size
  const { user } = useAuth();
  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Get route parameter for variation ID
  const { variationId } = useParams<VariationDeliverableParams>();
  
  // First stage: Get variation info using the standardized hook
  // This must complete before attempting to fetch area data
  const { variation, projectGuid, loading: isVariationLoading, error: variationError } = 
    useVariationInfo(variationId, user?.token);
    
  // Second stage: Get project info directly using useProjectInfo for consistency with deliverables.tsx
  // This ensures we have the full project data without going through variation.project
  const { project, isLoading: isProjectLoading } = useProjectInfo(projectGuid, user?.token);
  
  // Get data providers directly - hooks now have early-return logic when projectGuid is undefined
  const { areasDataSource, isLoading: areasLoading } = useAreaDataProvider(projectGuid);
  const { disciplinesDataSource, isLoading: disciplinesLoading } = useDisciplineDataProvider();
  const { documentTypesDataSource, isLoading: documentTypesLoading } = useDocumentTypeDataProvider();
  
  // Combine loading states for lookup data
  const isLookupDataLoading = areasLoading || disciplinesLoading || documentTypesLoading;
  
  // Get grid handlers from the hook - passing project and projectGuid directly
  const {
    handleGridInitialized: baseHandleGridInitialized,
    handleRowUpdating,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    handleCancellationClick
  } = useVariationDeliverableGridHandlers({
    project, // Pass project directly for client/project info
    projectGuid
  });
  
  // Grid initialization handler - no longer need to store reference since we fixed data providers
  const handleGridInitialized = useCallback((e: any) => {
    // Pass to the base handler for initialization
    baseHandleGridInitialized(e);
  }, [baseHandleGridInitialized]);
  
  // Simplified state tracking - single state to track if the grid should display
  const [dataReady, setDataReady] = useState(false);
  
  // Single useEffect to mark data as ready when all dependencies are loaded
  useEffect(() => {
    if (!isLookupDataLoading && !isVariationLoading && !isProjectLoading) {
      setDataReady(true);
    }
  }, [isLookupDataLoading, isVariationLoading, isProjectLoading]);
  

  
  // Create a memoized data store to prevent new instances on re-renders
  const store = useMemo(() => {
    if (!variationId || !user?.token) return null;
    
    return new ODataStore({
      url: getVariationDeliverablesWithParamUrl(variationId),
      version: 4,
      key: 'originalDeliverableGuid', // Using originalDeliverableGuid as key for tracking rows
      keyType: 'Guid',
      beforeSend: (options) => {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${user.token}`
        };
      },
      fieldTypes: {
        variationGuid: 'Guid',
        projectGuid: 'Guid',
        originalDeliverableGuid: 'Guid'
      }
    });
  }, [variationId, user?.token]);
  
  // Create a memoized data source to prevent new instances on re-renders
  const dataSource = useMemo(() => {
    if (!store) return null;
    
    return new DataSource({
      store,
      sort: [{ selector: 'internalDocumentNumber', desc: true }]
    });
  }, [store]);
  
  // Create columns with the lookup data sources from dedicated providers
  const columns = useMemo(() => {
    const baseColumns = createVariationDeliverableColumns(
      areasDataSource,
      disciplinesDataSource,
      documentTypesDataSource,
      isMobile,
      handleCancellationClick
    );
    
    // Process columns to ensure all have a dataField property for ODataGrid compatibility
    return processVariationDeliverableColumns(baseColumns) as ODataGridColumn[];
  }, [areasDataSource, disciplinesDataSource, documentTypesDataSource, isMobile, handleCancellationClick]);

  // Combine error states
  const error = variationError;
  const isReadOnly = false; // Set appropriate read-only logic if needed

  return (
    <div className="variation-deliverables-container">
      {/* Display errors */}
      {error && (
        <div className="alert alert-danger">
          Error: {error}
        </div>
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {variation?.project ? `${variation.project.projectNumber} - ${variation.project.name} Variation Deliverables` : 'Variation Deliverables'}
        </div>
        
        {/* Only render the grid once data is loaded */}
        <ODataGrid
          title=" "
          onInitialized={handleGridInitialized}
          // Grid CRUD event handlers - all from useVariationDeliverableGridHandlers
          onRowUpdating={handleRowUpdating}
          onRowInserting={handleRowInserting}
          onRowValidating={handleRowValidating}
          onInitNewRow={handleInitNewRow}
          onEditorPreparing={handleEditorPreparing}
          // Use the memoized data source instead of an endpoint
          dataSource={dataSource}
          loading={!dataReady || isVariationLoading || isLookupDataLoading}
          columns={columns}
          keyField="originalDeliverableGuid"
          defaultPageSize={20}
          countColumn="guid"
          allowUpdating={!isReadOnly}
          allowAdding={!isReadOnly}
          allowDeleting={false}
          showRecordCount={true}
          customGridHeight={900}
          storeOptions={{
            // Additional store config if needed
          }}
        />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default VariationDeliverablesFinal;
