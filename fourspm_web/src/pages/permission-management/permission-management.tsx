import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useRoleDataProvider } from '../../hooks/data-providers/useRoleDataProvider';
import { Role } from '../../types/role-types';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Scrolling, Paging, Selection, Pager, FilterRow } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { PermissionsProvider, usePermissions } from '../../contexts/permissions/permissions-context';
import './permission-management.scss';

/**
 * Permission Management Content Component
 */
const PermissionManagementContent: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const history = useHistory();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Get role data provider
  const { rolesStore } = useRoleDataProvider();
  
  // Get permissions context
  const { 
    permissions, 
    isLoading: permissionsLoading,
    selectedPermissionIds,
    setSelectedPermissions,
    savePermissions,
    isSaving,
    hasSaved,
    hasError
  } = usePermissions();
  
  // Load role data
  useEffect(() => {
    const loadRole = async () => {
      if (roleId) {
        try {
          const roleData = await rolesStore.byKey(roleId) as Role;
          setRole(roleData);
        } catch (error) {
          console.error('Error loading role:', error);
          notify({
            message: 'Error loading role. Please try again.',
            type: 'error',
            displayTime: 3000,
            position: { at: 'top center', my: 'top center' }
          });
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadRole();
  }, [roleId, rolesStore]);
  
  // Handle permission selection changes
  const handleSelectionChanged = useCallback(({ selectedRowKeys }: any) => {
    setSelectedPermissions(selectedRowKeys);
  }, [setSelectedPermissions]);
  
  // Handle save permissions
  const handleSavePermissions = useCallback(async () => {
    if (!roleId) return;
    
    try {
      await savePermissions();
      
      // Success notification is handled within the context
    } catch (error) {
      console.error('Error saving permissions:', error);
      // Error handling is done by the context already
    }
  }, [roleId, savePermissions]);
  
  // Handle return to roles
  const handleReturnToRoles = useCallback(() => {
    history.push('/role-management');
  }, [history]);
  
  // Determine if there's a system role (which has restrictions)
  const isSystemRole = role?.isSystemRole || false;
  
  // Showing loading state
  if (loading || permissionsLoading) {
    return (
      <div className="permission-management-page">
        <Popup
          visible={true}
          dragEnabled={false}
          closeOnOutsideClick={false}
          showTitle={false}
          showCloseButton={false}
          width={300}
          height={120}
          position={{ my: 'center', at: 'center', of: window }}
        >
          <div className="loading-container">
            <LoadIndicator width={40} height={40} />
            <div className="loading-text">Loading permissions...</div>
          </div>
        </Popup>
      </div>
    );
  }
  
  return (
    <div className="permission-management-page">
      <div className="content-block">
        <div className="content-header">
          <div className="content-header-left">
            <h2 className="content-header-title">Manage Permissions</h2>
            <div className="role-info">
              <span className="role-name">{role?.name}</span>
              {isSystemRole && (
                <span className="system-role-badge">System Role</span>
              )}
            </div>
            <p className="role-description">{role?.description}</p>
          </div>
          <div className="content-header-right">
            <Button
              text="Save Permissions"
              type="default"
              icon="save"
              onClick={handleSavePermissions}
              disabled={isSaving || isSystemRole}
              className="save-button"
            />
            <Button
              text="Return to Roles"
              type="normal"
              icon="arrowleft"
              onClick={handleReturnToRoles}
              disabled={isSaving}
            />
          </div>
        </div>
        
        {isSystemRole && (
          <div className="system-role-warning">
            System roles have predefined permissions that cannot be modified.
          </div>
        )}
        
        <div className="permission-grid-container">
          <DataGrid
            dataSource={permissions}
            keyExpr="id"
            showBorders={true}
            columnAutoWidth={true}
            allowColumnReordering={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            selectedRowKeys={selectedPermissionIds}
            onSelectionChanged={handleSelectionChanged}
            height="calc(100vh - 250px)"
            disabled={isSystemRole}
          >
            <Selection mode="multiple" showCheckBoxesMode="always" />
            <Scrolling mode="standard" />
            <Paging defaultPageSize={20} />
            <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50, 100]} showInfo={true} />
            <FilterRow visible={true} />
            
            <Column dataField="id" caption="ID" visible={false} />
            <Column dataField="name" caption="Permission Name" />
            <Column dataField="description" caption="Description" />
            <Column dataField="category" caption="Category" width={150} />
          </DataGrid>
        </div>
      </div>
    </div>
  );
};

/**
 * Permission Management Page
 * Wraps the content with the permissions provider
 */
const PermissionManagement: React.FC = () => {
  return (
    <PermissionsProvider>
      <PermissionManagementContent />
    </PermissionsProvider>
  );
};

export default PermissionManagement;
