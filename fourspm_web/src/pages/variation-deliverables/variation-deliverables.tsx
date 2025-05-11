import React, { useMemo } from 'react';
import { ErrorMessage } from '@/components';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '@/components/ODataGrid/ODataGrid';
import { createVariationDeliverableColumns, processVariationDeliverableColumns } from './variation-deliverable-columns';
import ScrollToTop from '@/components/scroll-to-top/scroll-to-top';
import './variation-deliverables.scss';
import { getVariationDeliverablesWithParamUrl } from '@/config/api-endpoints';
import { useScreenSizeClass } from '@/utils/media-query';
import { LoadPanel } from 'devextreme-react/load-panel';
import { VariationDeliverablesProvider, useVariationDeliverables } from '@/contexts/variation-deliverables/variation-deliverables-context';
import { DeliverablesProvider } from '@/contexts/deliverables/deliverables-context';
// Use the DeliverableEditor context from deliverables context
import { useVariationDeliverableGridHandlers } from '@/hooks/grid-handlers/useVariationDeliverableGridHandlers';
import { useVariationInfo } from '@/hooks/utils/useVariationInfo';
import { useAuth } from '@/contexts/auth';

// Type definition for route parameters
interface VariationDeliverableParams {
  variationId: string;
}

/**
 * Main component that sets up context providers for Variation Deliverables
 * Following the Collection View Implementation Doctrine with two-layer architecture
 */
export function VariationDeliverables(): React.ReactElement {
  // Get route parameters - ALWAYS call hooks at the top level
  const { variationId } = useParams<VariationDeliverableParams>();
  const { user } = useAuth();
  
  // Get the variation info to retrieve the correct project ID
  // Always call hooks before any conditional returns
  const { projectGuid, loading } = useVariationInfo(variationId || '', user?.token);
  
  // Validate variationId exists
  if (!variationId) {
    return <div className="error-message">Variation ID is missing from the URL.</div>;
  }
  
  // Show loading state while we fetch the variation data
  if (loading) {
    return <div className="loading-message">Loading variation data...</div>;
  }
  
  // Validate that we got a project ID from the variation
  if (!projectGuid) {
    return <div className="error-message">Cannot load project for this variation.</div>;
  }
  
  return (
    <DeliverablesProvider projectId={projectGuid}>
      <VariationDeliverablesProvider variationId={variationId}>
        <VariationDeliverablesContent />
      </VariationDeliverablesProvider>
    </DeliverablesProvider>
  );
}

/**
 * Nested component that consumes both contexts
 * This pattern prevents using context before initialization
 */
const VariationDeliverablesContent = React.memo((): React.ReactElement => {
  // Get variation ID from URL params
  const { variationId } = useParams<VariationDeliverableParams>();
  
  // Use the variation deliverables context
  const {
    // State
    state,
    
    // Reference data
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    
    // Project and variation data
    project,
    variation,
    projectGuid
    
    // Field management functions are handled in grid handlers
  } = useVariationDeliverables();
  
  // We'll use the variation deliverables context for validation
  // In a future step, this would use a dedicated deliverable editor context
  
  // Get grid handlers with both context dependencies
  const {
    handleGridInitialized,
    handleRowUpdating,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    handleEditorPreparing,
    handleCancellationClick
  } = useVariationDeliverableGridHandlers({
    project,
    projectGuid
  });

  const screenClass = useScreenSizeClass();
  const isMobile = screenClass === 'screen-x-small' || screenClass === 'screen-small';
  
  // Determine if we're still loading any data
  const isLoading = state.loading || isLookupDataLoading;
  
  // Combine all error sources
  const hasError = state.error !== null;
  
  // Set the grid to read-only if the variation has been submitted
  const isReadOnly = variation?.submitted !== null && variation?.submitted !== undefined;
  
  // Create columns with the lookup data sources from dedicated providers
  const columns = useMemo(() => {
    // Only create columns when lookup data is ready
    if (isLoading || !areasDataSource || !disciplinesDataSource || !documentTypesDataSource) {
      return [];
    }
    
    const baseColumns = createVariationDeliverableColumns(
      areasDataSource,
      disciplinesDataSource,
      documentTypesDataSource,
      isMobile,
      handleCancellationClick,
      isReadOnly
    );
    
    // Process columns to ensure all have a dataField property for ODataGrid compatibility
    return processVariationDeliverableColumns(baseColumns);
  }, [areasDataSource, disciplinesDataSource, documentTypesDataSource, isLoading, isMobile, handleCancellationClick, isReadOnly]);
  
  // Adjust columns for mobile size if needed
  const mobileAdjustedColumns = useMemo(() => {
    if (!columns || columns.length === 0) return [];
    return isMobile 
      ? columns.filter(c => c.dataField !== 'description') // Example: Hide description on mobile
      : columns;
  }, [columns, isMobile]);
  
  return (
    <div className="variation-deliverables-container">
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
          title="Error Loading Variation Deliverables"
          message={state.error || 'An unknown error occurred'}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project && variation 
            ? `${project.name} - ${variation.name} Deliverables` 
            : 'Variation Deliverables'}
        </div>
        
        {!isLoading && !hasError && variation && variationId && (
          <ODataGrid
            title=" "
            endpoint={getVariationDeliverablesWithParamUrl(variationId)}
            columns={mobileAdjustedColumns.length > 0 ? mobileAdjustedColumns : []}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowInserting={handleRowInserting}
            onEditorPreparing={handleEditorPreparing}
            onInitialized={handleGridInitialized}
            countColumn="guid"
            defaultSort={[{ selector: 'internalDocumentNumber', desc: false }]}
            allowAdding={!isReadOnly}
            allowUpdating={!isReadOnly}
            allowDeleting={false}
            customGridHeight={900}
            // The ref is passed to the grid via onInitialized instead of directly
            storeOptions={{
              fieldTypes: {
                variationGuid: 'Guid',
                projectGuid: 'Guid',
                originalDeliverableGuid: 'Guid'
              }
            }}
            // Note: Add virtual scrolling in a subsequent ticket
            // The ODataGrid component needs to be updated to support these advanced features
          />
        )}
      </div>
      <ScrollToTop />
    </div>
  );
});

export default VariationDeliverables;
