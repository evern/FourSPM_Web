import React, { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRoleDataProvider } from '../../hooks/data-providers/useRoleDataProvider';
import { Role, RoleCreateParams, RoleUpdateParams } from '../../types/role-types';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { roleColumns } from './role-columns';
import { Popup } from 'devextreme-react/popup';
import { confirm } from 'devextreme/ui/dialog';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import RoleForm from './role-form';
import './role-management.scss';

/**
 * Role Management Page
 * Displays a grid of roles with CRUD operations
 */
const RoleManagement: React.FC = () => {
  const history = useHistory();
  const { rolesStore, isLoading, createRole, updateRole, deleteRole } = useRoleDataProvider();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isPopupVisible, setPopupVisible] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Handle create button click
  const handleCreateClick = useCallback(() => {
    setIsCreating(true);
    setEditingRole(null);
    setPopupVisible(true);
  }, []);

  // Handle edit button click
  const handleEditClick = useCallback((role: Role) => {
    setIsCreating(false);
    setEditingRole(role);
    setPopupVisible(true);
  }, []);

  // Handle delete button click
  const handleDeleteClick = useCallback(async (role: Role) => {
    const confirmed = await confirm(
      `Are you sure you want to delete the role "${role.name}"?`,
      'Confirm Deletion'
    );

    if (confirmed) {
      try {
        await deleteRole(role.id);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  }, [deleteRole]);

  // Handle form save
  const handleFormSave = useCallback(async (formData: RoleCreateParams | RoleUpdateParams) => {
    try {
      if (isCreating) {
        await createRole(formData as RoleCreateParams);
      } else if (editingRole) {
        await updateRole({
          ...formData,
          id: editingRole.id
        } as RoleUpdateParams);
      }
      setPopupVisible(false);
    } catch (error) {
      console.error('Error saving role:', error);
      // Error will be handled by the mutation error handler in useRoleDataProvider
    }
  }, [isCreating, editingRole, createRole, updateRole]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setPopupVisible(false);
  }, []);
  
  // Handle manage permissions
  const handleManagePermissions = useCallback((roleId: string) => {
    // Navigate to the permissions management page for this role
    history.push(`/role-management/${roleId}/permissions`);
    
    // Display notification for navigating to permissions page
    notify({
      message: 'Opening permission management...',
      type: 'info',
      displayTime: 2000,
      position: { at: 'top center', my: 'top center' }
    });
  }, [history]);

  // Custom render for action buttons in grid
  const renderGridActions = useCallback((rowData: Role) => {
    const canModify = !rowData.isSystemRole;
    
    return (
      <div className="grid-actions">
        <Button
          icon="edit"
          onClick={() => handleEditClick(rowData)}
          disabled={!canModify}
          hint={canModify ? 'Edit role' : 'System roles cannot be modified'}
        />
        <Button
          icon="trash"
          onClick={() => handleDeleteClick(rowData)}
          disabled={!canModify}
          hint={canModify ? 'Delete role' : 'System roles cannot be deleted'}
        />
      </div>
    );
  }, [handleEditClick, handleDeleteClick]);

  return (
    <div className="role-management-page">
      <div className="content-block">
        <div className="content-header">
          <h2 className="content-header-title">Role Management</h2>
          <Button
            text="Create Role"
            type="default"
            icon="add"
            onClick={handleCreateClick}
          />
        </div>

        <ODataGrid
          title="Roles"
          dataSource={rolesStore}
          columns={roleColumns(renderGridActions, handleManagePermissions)}
          keyField="id"
          customGridHeight="calc(100vh - 200px)"
          loading={isLoading}
        />
      </div>

      <Popup
        visible={isPopupVisible}
        onHiding={handlePopupClose}
        title={isCreating ? 'Create Role' : 'Edit Role'}
        showCloseButton={true}
        width={500}
        height={450}
        position={{ my: 'center', at: 'center', of: window }}
      >
        <RoleForm
          role={isCreating ? undefined : editingRole}
          onSave={handleFormSave}
          onCancel={handlePopupClose}
        />
      </Popup>
    </div>
  );
};

export default RoleManagement;
