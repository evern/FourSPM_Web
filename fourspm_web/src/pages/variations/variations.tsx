import React from 'react';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components';
import { variationColumns } from './variation-columns';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import { useAuth } from '../../contexts/auth';
// Removed useProjectInfo import as we now get project from context
import { VariationsProvider, useVariations } from '../../contexts/variations/variations-context';
import { useVariationGridHandlers } from '../../hooks/grid-handlers/useVariationGridHandlers';
import ScrollToTop from '../../components/scroll-to-top';
import './variations.scss';

/**
 * Variation params interface
 */
interface VariationParams {
  projectId: string;
}

/**
 * Variations component
 * 
 * Uses the Context + Reducer pattern for clean separation of view and logic.
 * This component follows the same pattern as other modules like Projects and DeliverableProgress.
 */
function Variations(): React.ReactElement {
  return (
    <VariationsProvider>
      <VariationsContent />
    </VariationsProvider>
  );
}

/**
 * Internal component that consumes the context
 * Focuses purely on rendering and delegating events to the context
 */
const VariationsContent = (): React.ReactElement => {
  const { projectId } = useParams<VariationParams>();
  const { user } = useAuth();
  
  // Get data from our combined context - now including project data
  const { state, project, isLookupDataLoading } = useVariations();
  
  // Use our custom grid handlers
  const {
    // Row operations
    handleRowValidating,
    handleRowInserting,
    handleRowRemoving,
    // Editor operations
    handleEditorPreparing,
    handleInitNewRow,
    // Status operations
    handleApproveVariation,
    handleRejectVariation
  } = useVariationGridHandlers({
    projectId,
    userToken: user?.token
  });
  
  // Create variation columns configuration with handlers
  const variationColumnsConfig = {
    handleApproveVariation,
    handleRejectVariation,
    showSuccess: (message: string) => alert(`Success: ${message}`),
    showError: (message: string) => alert(`Error: ${message}`)
  };
  
  // Create project filter for grid
  const projectFilter: [string, string, any][] = projectId ? [["projectGuid", "=", projectId]] : [];
  
  // We now use handleEditorPreparing directly as it contains all needed customizations

  return (
    <div className="variations-container">
      {/* Display error message if there is one */}
      {(state.error || state.editorError) && (
        <div className="alert alert-danger">
          Error: {state.error || state.editorError}
        </div>
      )}
      
      {/* Loading indicator */}
      <LoadPanel 
        visible={isLookupDataLoading} 
        message={state.loading ? 'Loading variations...' : 'Loading project data...'}
        position={{ of: '.custom-grid-wrapper' }}
      />
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Variations` : 'Variations'}
        </div>
        
        <ODataGrid
          title=" "
          endpoint={VARIATIONS_ENDPOINT}
          columns={variationColumns(variationColumnsConfig)}
          keyField="guid"
          onRowValidating={handleRowValidating}
          onRowInserting={handleRowInserting}
          onRowRemoving={handleRowRemoving}
          onEditorPreparing={handleEditorPreparing}
          onInitNewRow={handleInitNewRow}
          allowAdding={true}
          allowUpdating={true}
          allowDeleting={true}
          defaultFilter={projectFilter}
          // Add default sort to ensure consistent query parameters
          defaultSort={[{ selector: 'created', desc: true }]}
          customGridHeight={900}
          // Add countColumn for proper OData count handling
          countColumn="guid"
        />
      </div>
      
      <ScrollToTop />
    </div>
  );
};

export default Variations;
