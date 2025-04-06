import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/auth';
import { ODataGrid, ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { getVariationById } from '../../adapters/variation.adapter';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { createVariationDeliverableColumns } from './variation-deliverable-columns';
import { useVariationDeliverableCollectionController } from '../../hooks/controllers/useVariationDeliverableCollectionController';
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
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
  
  // Reference to the grid component
  const gridRef = useRef<any>(null);
  
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
    getDeliverablesByVariationEndpoint,
    deliverables,
    loadDeliverables,
    loading,
    isReadOnly,
    handleGridInitialized, // Use the grid initialization handler directly from useGridUtils
    arrayStore, // Use the arrayStore from the controller
    deliverableDataSource // Use the dataSource from the controller
  } = useVariationDeliverableCollectionController({
    token: user?.token,
    variationGuid,
    onError,
    onSuccess
  });
  
  // Load deliverables when the component mounts
  useEffect(() => {
    console.log('VariationDeliverables component mounted, calling loadDeliverables');
    loadDeliverables();
  }, [loadDeliverables]);
  
  // State for variation and derived projectGuid
  const [variation, setVariation] = useState<any>(null);
  const [projectGuid, setProjectGuid] = useState<string>('');
  
  // Load the variation data to get project info
  useEffect(() => {
    const loadVariationData = async () => {
      if (variationGuid && user?.token) {
        try {
          const variationData = await getVariationById(variationGuid, user.token);
          setVariation(variationData);
          setProjectGuid(variationData.projectGuid);
        } catch (error) {
          console.error('Error loading variation data:', error);
        }
      }
    };
    
    loadVariationData();
  }, [variationGuid, user?.token]);
  
  // Get areas using the data provider hook - only when projectGuid is available
  const { areasDataSource } = useAreaDataProvider(projectGuid);
  
  // Get disciplines using the standardized hook
  const { disciplinesStore } = useDisciplineDataProvider();
  
  // Get document types using the standardized hook
  const { documentTypesStore } = useDocumentTypeDataProvider();
  
  // Get project info - only when projectGuid is available
  const { project } = useProjectInfo(projectGuid, user?.token);
  
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
  
  // Ensure all columns have a dataField property for ODataGrid compatibility
  const columns = baseColumns.map(col => {
    // If column has no dataField but has 'type' (like button columns), use 'guid' as dataField
    if (!col.dataField && col.type === 'buttons') {
      return { ...col, dataField: 'guid' };
    }
    return col;
  }) as ODataGridColumn[];
  
  // No need to create ArrayStore or DataSource here - they're provided by the controller

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
