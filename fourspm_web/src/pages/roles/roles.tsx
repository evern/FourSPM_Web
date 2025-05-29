import React, { useCallback, useEffect } from 'react';
import { ODataGrid } from '../../components';
import { roleColumns } from './role-columns';
import { ROLES_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { RolesProvider, useRoles } from '../../contexts/roles/roles-context';
import { useRoleGridHandlers } from '../../hooks/grid-handlers/useRoleGridHandlers';
import ScrollToTop from '../../components/scroll-to-top';
import './roles.scss';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';

// Roles component using the Context + Reducer pattern for clean separation of view and logic
function Roles(): React.ReactElement {
  return (
    <RolesProvider>
      <RolesContent />
    </RolesProvider>
  );
}

// Internal component that consumes the context
const RolesContent = (): React.ReactElement => {
  // Get data from our roles context
  const { 
    state: { loading, error, editorError },
  } = useRoles();

  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check role edit permissions
  const canEditRoles = useCallback(() => {
    return canEdit(PERMISSIONS.ROLES.EDIT.split('.')[0]); // Extract 'roles' from 'roles.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditRoles() && !loading && !permissionsLoading) {
      showReadOnlyNotification('roles');
    }
  }, [canEditRoles, loading, permissionsLoading]);

  // Use our custom grid handlers
  const {
    // Row operations
    handleRowValidating,
    handleRowInserting,
    handleRowRemoving,
    // Editor operations
    handleEditorPreparing,
    handleInitNewRow
  } = useRoleGridHandlers();
  
  // Create role columns configuration with handlers
  const roleColumnsConfig = {
    showSuccess: (message: string) => notify({
      message: `Success: ${message}`,
      type: 'success',
      displayTime: 2000,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    }),
    showError: (message: string) => notify({
      message: `Error: ${message}`,
      type: 'error',
      displayTime: 3500,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    })
  };
  
  // Display error notifications whenever errors occur
  useEffect(() => {
    if (error || editorError) {
      notify({
        message: `Error: ${error || editorError}`,
        type: 'error',
        displayTime: 3500,
        position: {
          at: 'top center',
          my: 'top center',
          offset: '0 10'
        }
      });
    }
  }, [error, editorError]);
  
  // Create a consistent title for display and export
  const gridTitle = 'Roles';

  return (
    <div className="roles-container">      
            <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {gridTitle}
        </div>
        
        <ODataGrid
          title=" "
          exportFileName={gridTitle}
          endpoint={ROLES_ENDPOINT}
          columns={roleColumns(roleColumnsConfig)}
          keyField="guid"
          onRowValidating={handleRowValidating}
          onRowInserting={handleRowInserting}
          onRowRemoving={handleRowRemoving}
          onEditorPreparing={handleEditorPreparing}
          onInitNewRow={handleInitNewRow}
          allowAdding={canEditRoles()}
          allowUpdating={canEditRoles()}
          allowDeleting={canEditRoles()}
          defaultSort={[{ selector: 'displayName', desc: false }]}
          customGridHeight={900}
          countColumn="guid"
        />
      </div>
      
      <ScrollToTop />
    </div>
  );
};

export default Roles;
