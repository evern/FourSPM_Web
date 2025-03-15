import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { deliverableColumns } from './deliverable-columns';
import { useAuth } from '../../contexts/auth';

interface DeliverableParams {
  projectId: string;
}

const Deliverables: React.FC = () => {
  const { projectId } = useParams<DeliverableParams>();
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Deliverables`;
  
  console.log('Deliverables Component - Initial Render:', {
    projectId,
    endpoint,
    hasToken: !!user?.token
  });

  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete deliverable:', error),
    onUpdateError: (error) => console.error('Failed to update deliverable:', error)
  });

  const handleRowValidating = useGridValidation([
    { 
      field: 'areaNumber', 
      required: true, 
      maxLength: 2,
      pattern: /^[0-9][0-9]$/,
      errorText: 'Area Number must be exactly 2 digits (00-99)' 
    },
    { 
      field: 'discipline', 
      required: true, 
      maxLength: 2,
      pattern: /^[A-Z][A-Z]$/,
      errorText: 'Discipline must be exactly 2 uppercase letters' 
    },
    { 
      field: 'documentType', 
      required: true, 
      maxLength: 3,
      pattern: /^[A-Z][A-Z][A-Z]$/,
      errorText: 'Document Type must be exactly 3 uppercase letters' 
    },
    { field: 'departmentId', required: true, errorText: 'Department is required' },
    { field: 'deliverableTypeId', required: true, errorText: 'Deliverable Type is required' },
    { field: 'documentTitle', required: true, maxLength: 200, errorText: 'Document Title is required' }
  ]);

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      projectGuid: projectId,
      clientNumber: '',  
      projectNumber: '', 
      areaNumber: '',
      discipline: '',
      documentType: '',
      departmentId: 0, // Default to 'Administration', which is enum value 0
      deliverableTypeId: 'Task', 
      internalDocumentNumber: '',
      clientDocumentNumber: '',
      documentTitle: '',
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,    
      totalCost: 0,
      bookingCode: ''    
    };
  };

  return (
    <ODataGrid
      title="Deliverables"
      endpoint={endpoint}
      columns={deliverableColumns}
      keyField="guid"
      onRowUpdating={handleRowUpdating}
      onInitNewRow={handleInitNewRow}
      onRowValidating={handleRowValidating}
      onRowRemoving={handleRowRemoving}
      defaultFilter={[['projectGuid', '=', projectId]]}
    />
  );
};

export default Deliverables;
