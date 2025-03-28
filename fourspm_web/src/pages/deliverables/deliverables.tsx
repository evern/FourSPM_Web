import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { createDeliverableColumns } from './deliverable-columns';
import { useAuth } from '../../contexts/auth';
import ScrollToTop from '../../components/scroll-to-top';
import './deliverables.scss';
import { DELIVERABLES_ENDPOINT } from '@/config/api-endpoints';
import { useProjectDeliverableCollectionController } from '@/hooks/controllers/useDeliverableCollectionController';
import { useAreaDataProvider } from '../../hooks/data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../../hooks/data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../../hooks/data-providers/useDocumentTypeDataProvider';

interface DeliverableParams {
  projectId: string;
}

const Deliverables: React.FC = () => {
  const { projectId } = useParams<DeliverableParams>();
  const { user } = useAuth();
  const endpoint = DELIVERABLES_ENDPOINT;
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Common breakpoint for mobile
    };
    
    checkMobile(); // Check on initial render
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Use the enhanced controller with project-specific functionality
  const {
    handleEditorPreparing,
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow,
    handleGridInitialized,
    project
  } = useProjectDeliverableCollectionController(
    user?.token,
    projectId,
    {
      endpoint,
      onDeleteError: (error) => console.error('Failed to delete deliverable:', error),
      onUpdateError: (error) => console.error('Failed to update deliverable:', error)
    }
  );

  // Get areas using the new data provider hook
  const { areasDataSource } = useAreaDataProvider(projectId);
  
  // Get disciplines using the standardized hook
  const { disciplinesStore } = useDisciplineDataProvider();
  
  // Get document types using the standardized hook
  const { documentTypesStore } = useDocumentTypeDataProvider();

  // Create columns with the areas, disciplines, and document types data
  const columns = createDeliverableColumns(areasDataSource, disciplinesStore, documentTypesStore);
  
  // WORKAROUND: Filter out the deliverableTypeId column entirely on mobile
  // This is needed because setting 'visible: false' doesn't work as expected
  const mobileAdjustedColumns = isMobile 
    ? columns.filter(column => column.dataField !== 'deliverableTypeId')
    : columns;

  return (
    <div className="deliverables-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{project ? `${project.projectNumber} - ${project.name} Deliverables` : 'Deliverables'}</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={mobileAdjustedColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
          onEditorPreparing={handleEditorPreparing}
          onInitialized={handleGridInitialized}
          defaultFilter={[['projectGuid', '=', projectId]]}
        />
      </div>
      <ScrollToTop />
    </div>
  );
};

export default Deliverables;
