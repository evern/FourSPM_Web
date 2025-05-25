import React, { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { ErrorMessage, ODataGrid } from '@/components';
import { Column } from 'devextreme/ui/data_grid';
import ODataStore from 'devextreme/data/odata/store';
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
  
  // Use the permissions context hooks for grid handlers and notifications
  const {
    handleEditorPreparing,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    showSuccess,
    showError
  } = useRolePermissionGridHandlers();
  
  // Access the functions from permissions context
  const permissions = usePermissions();
  
  // Create columns with the permission action handlers
  const columns = useMemo(() => {
    return permissionColumns({
      setAccessLevel: permissions.setAccessLevel,
      setToggleState: permissions.setToggleState,
      showSuccess,
      showError
    });
  }, [
    permissions.setAccessLevel, 
    permissions.setToggleState, 
    showSuccess, 
    showError
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
        {!loading && !error ? (
          role?.guid ? (
            <ODataGrid
              key={`permissions-grid-${new Date().getTime()}`} // Force complete re-render on each render
              title=" "
              endpoint={`${ROLE_PERMISSIONS_ENDPOINT}/GetPermissionSummary(roleId=${role.guid})`}
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
          ) : (
            <div className="dx-card empty-message">
              <div className="message-content">
                <i className="dx-icon dx-icon-info" />
                <span>Please select a role to manage permissions</span>
              </div>
            </div>
          )
        ) : null}
      </div>
      
      <ScrollToTop />
    </div>
  );
});

export default RolePermissions;
