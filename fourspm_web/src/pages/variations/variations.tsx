import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { variationColumns } from './variation-columns';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import { useAuth } from '../../contexts/auth';
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
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
  
  // Get data from our combined context
  const { state, handleVariationEditorPreparing, handleVariationInitNewRow } = useVariations();
  
  // Get project info for display in the title
  const { project, isLoading: projectLoading } = useProjectInfo(projectId, user?.token);
  
  // Use our custom grid handlers
  const {
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleEditorPreparing,
    handleInitNewRow,
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
  
  // Combined handler for editor preparing
  const handleCombinedEditorPreparing = useCallback((e: any) => {
    // First let the editor context prepare the editor
    handleVariationEditorPreparing(e);
    // Then let the grid handlers add any additional preparation
    handleEditorPreparing(e);
  }, [handleVariationEditorPreparing, handleEditorPreparing]);
  
  // Combined handler for init new row
  const handleCombinedInitNewRow = useCallback((e: any) => {
    // First let the editor context initialize the row
    handleVariationInitNewRow(e);
    // Then let the grid handlers add any additional initialization
    handleInitNewRow(e);
  }, [handleVariationInitNewRow, handleInitNewRow]);

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
        visible={state.loading || projectLoading} 
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
          onRowUpdating={handleRowUpdating}
          onRowInserting={handleRowInserting}
          onRowRemoving={handleRowRemoving}
          onEditorPreparing={handleCombinedEditorPreparing}
          onInitNewRow={handleCombinedInitNewRow}
          allowAdding={true}
          allowUpdating={true}
          allowDeleting={true}
          defaultFilter={projectFilter}
          // Add default sort to ensure consistent query parameters
          defaultSort={[{ selector: 'created', desc: true }]}
        />
      </div>
      
      <ScrollToTop />
    </div>
  );
};

export default Variations;
