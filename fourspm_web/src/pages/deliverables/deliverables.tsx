import React from 'react';
import { useParams } from 'react-router-dom';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useGridValidation } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { deliverableColumns } from './deliverable-columns';

interface DeliverableParams {
  projectId: string;
}

const Deliverables: React.FC = () => {
  const { projectId } = useParams<DeliverableParams>();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/Deliverables`;
  
  const { handleRowUpdating, handleRowRemoving } = useGridOperations({
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete deliverable:', error),
    onUpdateError: (error) => console.error('Failed to update deliverable:', error)
  });

  const handleRowValidating = useGridValidation([
    { field: 'areaNumber', required: true, maxLength: 3, errorText: 'Area Number must be at most 3 characters' },
    { field: 'discipline', required: true, maxLength: 50, errorText: 'Discipline is required' },
    { field: 'documentType', required: true, maxLength: 50, errorText: 'Document Type is required' },
    { field: 'departmentId', required: true, errorText: 'Department is required' },
    { field: 'deliverableTypeId', required: true, errorText: 'Deliverable Type is required' },
    { field: 'documentTitle', required: true, maxLength: 200, errorText: 'Document Title is required' }
  ]);

  const handleInitNewRow = (e: any) => {
    const project = e.component.getDataSource().items()[0]?.project || {};
    e.data = {
      id: uuidv4(),
      projectId: projectId,
      clientNumber: project.clientNumber,
      projectNumber: project.projectNumber
    };
  };

  return (
    <ODataGrid
      title="Deliverables"
      endpoint={endpoint}
      columns={deliverableColumns}
      keyField="id"
      onRowUpdating={handleRowUpdating}
      onInitNewRow={handleInitNewRow}
      onRowValidating={handleRowValidating}
      onRowRemoving={handleRowRemoving}
      defaultFilter={[['projectId', '=', projectId]]}
    />
  );
};

export default Deliverables;
