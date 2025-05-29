import React, { useState, useEffect, useCallback } from 'react';
import { ODataGrid } from '../../components';
import { disciplineColumns } from './discipline-columns';
import { DISCIPLINES_ENDPOINT } from '@/config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import './disciplines.scss';
import { DisciplinesProvider, useDisciplines } from '@/contexts/disciplines/disciplines-context';
import { useDisciplineGridHandlers } from '@/hooks/grid-handlers/useDisciplineGridHandlers';
import { ErrorMessage } from '@/components';
// Import getToken for direct access to token
import { getToken } from '@/utils/token-store';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';

// Main Disciplines component following the Collection View Doctrine
export function Disciplines(): React.ReactElement {
  return (
    <DisciplinesProvider>
      <DisciplinesContent />
    </DisciplinesProvider>
  );
}

// Internal component that uses the disciplines context
const DisciplinesContent = React.memo((): React.ReactElement => {
  // No longer need local token state or direct MSAL access
  
  // Use the disciplines context
  const {
    state: { loading: contextLoading, error: contextError },
    disciplinesLoading,
    disciplinesError
  } = useDisciplines();

  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check discipline edit permissions
  const canEditDisciplines = useCallback(() => {
    return canEdit(PERMISSIONS.DISCIPLINES.EDIT.split('.')[0]); // Extract 'disciplines' from 'disciplines.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditDisciplines() && !contextLoading && !permissionsLoading) {
      showReadOnlyNotification('disciplines');
    }
  }, [canEditDisciplines, contextLoading, permissionsLoading]);

  // Use the dedicated grid handlers hook - token access happens directly in handlers
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDisciplineGridHandlers({});
  
  // Determine if we're still loading - combine context and query loading states
  const isLoading = disciplinesLoading || contextLoading;
  
  // Check for errors - account for both context and query errors
  const hasError = contextError !== null || disciplinesError !== null;
  
  // Create a consistent title for display and export
  const gridTitle = 'Disciplines';

  return (
    <div className="disciplines-container">

      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={isLoading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      

      {hasError && (
        <ErrorMessage
          title="Error Loading Disciplines"
          message={contextError || (disciplinesError ? String(disciplinesError) : 'An unknown error occurred')}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{gridTitle}</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
            exportFileName={gridTitle}
            endpoint={DISCIPLINES_ENDPOINT}
            columns={disciplineColumns}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onInitialized={handleGridInitialized}
            defaultSort={[{ selector: 'code', desc: false }]}
            customGridHeight={900}
            allowAdding={canEditDisciplines()}
            allowUpdating={canEditDisciplines()}
            allowDeleting={canEditDisciplines()}
          />
        )}
      </div>
    </div>
  );
});



export default Disciplines;
