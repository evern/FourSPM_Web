import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { ErrorMessage, ODataGrid } from '@/components';
import { Column } from 'devextreme/ui/data_grid';
import { PermissionsProvider, usePermissions } from '@/contexts/permissions/permissions-context';
import { permissionColumns } from './permission-columns';
import { useRolePermissionGridHandlers } from '@/hooks/grid-handlers/useRolePermissionGridHandlers';
import { PermissionLevel } from '@/contexts/permissions/permissions-types';
import { ScrollToTop } from '@/components';
import { ROLE_PERMISSIONS_ENDPOINT } from '@/config/api-endpoints';
import './role-permissions.scss';

// Type definition for route parameters
interface RolePermissionParams {
  roleId: string;
}

/**
 * Main component that sets up context providers for Role Permissions
 * Following the Collection View Implementation Doctrine with two-layer architecture
 */
export function RolePermissions(): React.ReactElement {
  // Get role ID from URL params
  const { roleId } = useParams<RolePermissionParams>();
  
  // Validate roleId exists
  if (!roleId) {
    return <div className="error-message">Role ID is missing from the URL.</div>;
  }
  
  return (
    <PermissionsProvider roleId={roleId}>
      <RolePermissionsContent />
    </PermissionsProvider>
  );
}

/**
 * Nested component that consumes the permissions context
 * This pattern prevents using context before initialization
 */
const RolePermissionsContent = React.memo((): React.ReactElement => {
  // Use the permissions context
  const {
    state: { loading, error, staticPermissions, permissionAssignments, role },
  } = usePermissions();
  
  // Use role permission grid handlers
  const {
    handlePermissionLevelChange,
    handleEditorPreparing,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleToggleChange,
    getPermissionLevel,
    showSuccess,
    showError
  } = useRolePermissionGridHandlers();
  
  // Create an adapter for the toggle change that converts boolean to number
  const handleToggleChangeAdapter = useCallback(
    (featureKey: string, isEnabled: boolean, displayName: string): Promise<void> => {
      // Convert boolean to numeric level (0 for false, 1 for true)
      const newLevel = isEnabled ? 1 : 0;
      return handleToggleChange(featureKey, newLevel, displayName);
    },
    [handleToggleChange]
  );
  
  // Create columns with the permission level change handler
  const columns = useMemo(() => {
    return permissionColumns({
      onPermissionLevelChange: handlePermissionLevelChange,
      getPermissionLevel,
      showSuccess,
      showError,
      onToggleChange: handleToggleChangeAdapter
    });
  }, [
    handlePermissionLevelChange, 
    getPermissionLevel, 
    showSuccess, 
    showError, 
    handleToggleChangeAdapter
  ]);
  
  return (
    <div className="role-permissions-container">
      {/* Loading indicator */}
      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      
      {/* Error message */}
      {error && (
        <ErrorMessage
          title="Error Loading Role Permissions"
          message={error}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          {role ? `Permissions for ${role.displayName}` : 'Role Permissions'}
        </div>
        {!loading && !error && (
            <ODataGrid
              title=" "
              endpoint={`${ROLE_PERMISSIONS_ENDPOINT}/GetPermissionSummary(roleId=${role?.guid})`}
              columns={columns}
              keyField="featureKey"
              customGridHeight={900}
              
              // Disable standard editing operations since we use custom buttons
              allowAdding={false}
              allowDeleting={false}
              allowUpdating={false}
              
              // Sorting and filtering
              defaultSort={[{ selector: 'featureGroup', desc: false }]}
              
              // Enable grouping by feature group
              allowGrouping={true}
              showGroupPanel={false}
              autoExpandAll={true}
              
              // Event handlers
              onEditorPreparing={handleEditorPreparing}
              onRowUpdating={handleRowUpdating}
              onRowInserting={handleRowInserting}
              onRowRemoving={handleRowRemoving}
          />
        )}
      </div>
      
      <ScrollToTop />
    </div>
  );
});

export default RolePermissions;
