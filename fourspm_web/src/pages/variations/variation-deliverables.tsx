import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { ODataGrid, ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { createVariationDeliverableColumns, processVariationDeliverableColumns } from './variation-deliverable-columns';
import { useVariationDeliverableCollectionController } from '../../hooks/controllers/useVariationDeliverableCollectionController';
import { useAreaDataProvider } from '../../hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../../hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../../hooks/data-providers/useDocumentTypeDataProvider';
import ScrollToTop from '../../components/scroll-to-top/scroll-to-top';
import './variation-deliverables.scss';

interface VariationDeliverableParams {
  variationId: string;
  projectId?: string;
}

// Make the component compatible with React Router by not defining props
const VariationDeliverables: React.FC = () => {
  // Get parameters from the route
  const params = useParams<VariationDeliverableParams>();
  const variationGuid = params.variationId;
  const { user } = useAuth();
  
  // Handle errors and success operations
  const onError = useCallback((error: any) => {
    console.error('Operation failed:', error);
  }, []);
  
  const onSuccess = useCallback(() => {
    console.log('Operation completed successfully');
  }, []);
  
  // Use the enhanced controller hook which contains most of our business logic
  const {
    handleCancellationClick,
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleInitNewRow,
    handleEditorPreparing,
    loading,
    isReadOnly,
    handleGridInitialized, // Use the grid initialization handler directly from useGridUtils
    deliverableDataSource,
    projectGuid,
    project
  } = useVariationDeliverableCollectionController({
    token: user?.token,
    variationGuid,
    onError,
    onSuccess
  });
  
  // Get areas using the data provider hook - only when projectGuid is available
  const { areasDataSource } = useAreaDataProvider(projectGuid);
  
  // Get disciplines using the standardized hook
  const { disciplinesStore } = useDisciplineDataProvider();
  
  // Get document types using the standardized hook
  const { documentTypesStore } = useDocumentTypeDataProvider();
  
  // Project info now comes directly from the controller
  // No need to use useProjectInfo here anymore
  
  // Create a callback for the cancellation button click
  const onCancellationClick = useCallback((data: any) => {
    handleCancellationClick(data);
  }, [handleCancellationClick]);
  
  // Create columns with the lookup data sources from dedicated providers
  const baseColumns = createVariationDeliverableColumns(
    areasDataSource,
    disciplinesStore,
    documentTypesStore,
    false, // isMobile
    onCancellationClick
  );
  
  // Process columns to ensure all have a dataField property for ODataGrid compatibility
  const columns = processVariationDeliverableColumns(baseColumns) as ODataGridColumn[];

  return (
    <div className="variation-deliverables-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {project ? `${project.projectNumber} - ${project.name} Variation Deliverables` : 'Variation Deliverables'}
        </div>
        <ODataGrid
          title=""
          onInitialized={handleGridInitialized}
          dataSource={deliverableDataSource} // Wrapped in ArrayStore for proper key handling
          loading={loading}
          columns={columns}
          keyField="guid"
          defaultPageSize={20}
          allowUpdating={!isReadOnly}
          allowAdding={!isReadOnly}
          allowDeleting={false}
          showRecordCount={true}
          onRowValidating={handleRowValidating}
          onRowInserting={handleRowInserting}
          onInitNewRow={handleInitNewRow}
          onEditorPreparing={handleEditorPreparing}
          onRowUpdating={handleRowUpdating}
        />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default VariationDeliverables;
