import React from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { API_CONFIG } from '../../config/api';
import { createProgressColumns } from './progress-columns';

interface ProgressGridProps {
  projectId: string | undefined;
  onRowUpdating: (e: any) => void;
  onRowValidating: (e: any) => void;
}

/**
 * Reusable component for displaying progress tracking grid
 * Can be used by any page that needs to display and edit deliverable progress
 */
const ProgressGrid: React.FC<ProgressGridProps> = ({ 
  projectId,
  onRowUpdating,
  onRowValidating
}) => {
  return (
    <ODataGrid
      title=" " /* Empty title since we display the title at page level */
      endpoint={`${API_CONFIG.baseUrl}/odata/v1/Deliverables`}
      columns={createProgressColumns()}
      keyField="guid"
      onRowUpdating={onRowUpdating}
      onRowValidating={onRowValidating}
      defaultFilter={[['projectGuid', '=', projectId]]}
      allowUpdating={true}
      allowAdding={false}
      allowDeleting={false}
    />
  );
};

export default ProgressGrid;
