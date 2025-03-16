import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { documentTypeColumns } from './document-type-columns';
import { useAuth } from '../../contexts/auth';
import './document-types.scss';

const DocumentTypes: React.FC = () => {
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/DocumentTypes`;
  
  console.log('Document Types Component - Initial Render:', {
    endpoint,
    hasToken: !!user?.token
  });

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete document type:', error),
    onUpdateError: (error) => console.error('Failed to update document type:', error)
  });

  const handleRowValidating = useGridValidation([
    { 
      field: 'code', 
      required: true, 
      maxLength: 3,
      pattern: /^[A-Z]{1,3}$/,
      errorText: 'Code must be 1-3 uppercase letters' 
    },
    { 
      field: 'name', 
      required: false, 
      maxLength: 500,
      errorText: 'Name cannot exceed 500 characters' 
    }
  ]);

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
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
        />
      </div>
    </div>
  );
};

export default DocumentTypes;
