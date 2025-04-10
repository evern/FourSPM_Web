import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { ODataGrid, ODataGridColumn } from '@/components/ODataGrid/ODataGrid';
import { LoadPanel } from 'devextreme-react/load-panel';
import { createVariationDeliverableColumns, processVariationDeliverableColumns } from './variation-deliverable-columns';
import ScrollToTop from '@/components/scroll-to-top/scroll-to-top';
import './variation-deliverables.scss';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

import { useScreenSizeClass } from '@/utils/media-query';

// Import grid handlers
import { useVariationDeliverableGridHandlers } from '@/hooks/grid-handlers/useVariationDeliverableGridHandlers';

// Import context provider that's still needed for grid handlers
import { VariationDeliverablesProvider, useVariationDeliverables } from '@/contexts/variation-deliverables/variation-deliverables-context';

// Import API endpoints
import { getVariationDeliverablesWithParamUrl } from '@/config/api-endpoints';

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
export function VariationDeliverables(): React.ReactElement {
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
  
  /**
   * Get data from sequential loading context:
   * 1. Variation is loaded first by useVariationInfo in the context
   * 2. Project is loaded using projectGuid from variation
   * 3. Data providers are loaded in the context after project and variation are available
   * 4. All data is provided through the context with combined loading states
   */
  const { 
    variation, 
    project, 
    projectGuid, 
    state, 
    // Get data providers from context instead of initializing them here
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading
  } = useVariationDeliverables();
  
  // Combined loading state (variation + project)
  const isLoading = state.loading; 
  const contextError = state.error;
  
  // Get grid handlers from the hook - passing project and projectGuid directly
  const {
    handleGridInitialized,
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
  
  /**
   * Sequential data readiness check:
   * 1. First verify we have variation and project data from context
   * 2. Then check if lookup data providers are ready
   * This ensures we follow the exact loading sequence needed
   */
  const dataReady = useMemo(() => {
    // Step 1: Check if context data is loaded and available
    const hasContextData = !!variation && !!project && !!projectGuid && !isLoading;
    if (!hasContextData) return false;
    
    // Step 2: Check if lookup data providers are ready
    return !isLookupDataLoading;
  }, [variation, project, projectGuid, isLoading, isLookupDataLoading]);
  

  
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
    // Only create columns when data is ready to prevent issues with undefined datasources
    if (!dataReady) {
      return [] as ODataGridColumn[];
    }
    
    const baseColumns = createVariationDeliverableColumns(
      areasDataSource,
      disciplinesDataSource,
      documentTypesDataSource,
      isMobile,
      handleCancellationClick
    );
    
    // Process columns to ensure all have a dataField property for ODataGrid compatibility
    return processVariationDeliverableColumns(baseColumns) as ODataGridColumn[];
  }, [dataReady, areasDataSource, disciplinesDataSource, documentTypesDataSource, isMobile, handleCancellationClick]);

  // Use error state from context
  const error = contextError;
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
          {project && variation ? `${project.name} - ${variation.name} Variations` : `Variation: ${variation?.name || 'Unknown'}`}
        </div>
        
        {/* ODataGrid container - always present for LoadPanel targeting */}
        <div className="odatagrid-container" style={{ position: 'relative', minHeight: '400px' }}>
          {/* Sequential loading with DevExtreme LoadPanel */}
          <LoadPanel
            shadingColor="rgba(0,0,0,0.1)"
            position={{ of: ".odatagrid-container" }}
            visible={!dataReady}
            showIndicator={true}
            showPane={true}
            message={isLoading ? 'Loading variation and project data...' : 'Loading lookup data...'}
          />
        
          {/* Only render the grid once data is loaded */}
          {dataReady && dataSource && (
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
            loading={false}
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
          )}
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default VariationDeliverables;
