import React from 'react';
import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { Role } from '../../types/role-types';
import { Button } from 'devextreme-react/button';

/**
 * Define columns for the role management grid
 * @param renderActions - Function to render action buttons
 * @param onManagePermissions - Function to handle permission management
 * @returns Array of column configurations
 */
export const roleColumns = (
  renderActions: (rowData: Role) => React.ReactNode,
  onManagePermissions?: (roleId: string) => void
): ODataGridColumn[] => [
  {
    dataField: 'name',
    caption: 'Role Name',
    dataType: 'string',
    minWidth: 150
  },
  {
    dataField: 'description',
    caption: 'Description',
    dataType: 'string',
    width: 300
  },
  {
    dataField: 'isSystemRole',
    caption: 'System Role',
    dataType: 'boolean',
    width: 120,
    cellTemplate: (cell: any, info: any) => {
      const value = cell.data.isSystemRole;
      return (
        <div className={`system-role-status ${value ? 'is-system' : 'is-custom'}`}>
          {value ? 'Yes' : 'No'}
        </div>
      );
    }
  },
  {
    dataField: 'permissions',
    caption: 'Permissions',
    dataType: 'object',
    width: 150,
    // Use customizeText instead of calculateDisplayValue for permission count
    customizeText: (cellInfo: any) => {
      const count = cellInfo.value?.length || 0;
      return `${count} permissions`;
    },
    cellTemplate: (cell: any, info: any) => {
      const count = cell.data.permissions?.length || 0;
      return <div className="permission-count">{count} permissions</div>;
    }
  },
  {
    dataField: 'createdAt',
    caption: 'Created Date',
    dataType: 'date',
    width: 140,
    hidingPriority: 1,
    customizeText: (cellInfo: any) => {
      const date = new Date(cellInfo.value);
      return date.toISOString().split('T')[0];
    }
  },
  {
    dataField: 'updatedAt',
    caption: 'Last Updated',
    dataType: 'date',
    width: 140,
    hidingPriority: 0,
    customizeText: (cellInfo: any) => {
      const date = new Date(cellInfo.value);
      return date.toISOString().split('T')[0];
    }
  },
  {
    type: 'buttons',
    dataField: 'id_permissions',
    caption: 'Permissions',
    width: 120,
    buttons: [
      {
        hint: 'Manage Permissions',
        icon: 'key',
        visible: (e: any) => !e.row.isNewRow && e.row.data.id,
        onClick: (e: any) => {
          if (onManagePermissions) {
            onManagePermissions(e.row.data.id);
          }
        }
      }
    ]
  },
  {
    type: 'buttons',
    caption: 'Actions',  // Required by ODataGridColumn
    width: 100,
    cellTemplate: (cell: any, info: any) => renderActions(cell.data)
  }
];
