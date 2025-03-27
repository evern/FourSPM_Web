import React from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useDocumentTypeCollectionController } from '../../hooks/controllers/useDocumentTypeCollectionController';
import { documentTypeColumns } from './document-type-columns';
import { useAuth } from '../../contexts/auth';
import { DOCUMENT_TYPES_ENDPOINT } from '@/config/api-endpoints';
import './document-types.scss';

const DocumentTypes: React.FC = () => {
  const { user } = useAuth();
  const endpoint = DOCUMENT_TYPES_ENDPOINT;
  
  // Use the enhanced useDocumentTypeData hook with integrated grid operations and validation
  const { 
    handleRowUpdating, 
    handleRowRemoving,
    handleRowInserting,
    handleInitNewRow,
    handleRowValidating
  } = useDocumentTypeCollectionController(user?.token, {
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete document type:', error),
    onUpdateError: (error) => console.error('Failed to update document type:', error)
  });

  return (
    <div className="document-types-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Document Types</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={documentTypeColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default DocumentTypes;
