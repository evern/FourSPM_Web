import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useDocumentTypeController } from '../../hooks/controllers/useDocumentTypeController';
import { documentTypeColumns } from './document-type-columns';
import { useAuth } from '../../contexts/auth';
import './document-types.scss';

const DocumentTypes: React.FC = () => {
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/DocumentTypes`;
  
  // Use the enhanced useDocumentTypeData hook with integrated grid operations and validation
  const { 
    handleRowUpdating, 
    handleRowRemoving,
    handleRowInserting,
    onRowValidating
  } = useDocumentTypeController(user?.token, {
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete document type:', error),
    onUpdateError: (error) => console.error('Failed to update document type:', error)
  });

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      code: '',
      name: ''
    };
  };

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
          onRowValidating={onRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default DocumentTypes;
