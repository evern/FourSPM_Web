import type { ODataGridColumn } from '../../components';
import { Role } from '../../contexts/roles/roles-types';

/**
 * Interface for the role columns configuration
 */
export interface RoleColumnsConfig {
  // Will be used for View Permissions button
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

/**
 * Generate the columns for the Roles grid
 * 
 * @param config Configuration for role columns
 * @returns Array of ODataGridColumn for the grid
 */
export const roleColumns = (config: RoleColumnsConfig): ODataGridColumn[] => {
  // Cast columns to any to avoid type errors with DevExtreme properties
  // This follows the pattern used throughout the application in other modules
  // Use an array of any type first, then cast the entire array to ODataGridColumn[]
  // This approach is used throughout the codebase for DevExtreme columns
  const columns: any[] = [
    {
      dataField: 'guid',
      caption: 'Permissions',
      width: 120,
      minWidth: 120,
      alignment: 'center',
      fixed: true,
      allowEditing: false,
      type: 'buttons',
      buttons: [
        {
          hint: 'View Role Permissions',
          icon: 'key',
          text: 'View',
          visible: (e) => !e.row.isNewRow && e.row.data.guid,
          onClick: (e: any) => {
            // This is a dummy implementation that will be replaced later
            config.showSuccess('Role permissions functionality will be implemented in a future update');
            // Will navigate to permissions page in the future
            // window.location.href = `#/roles/${e.row.data.guid}/permissions`;
          }
        }
      ]
    },
    {
      dataField: 'name',
      caption: 'Name',
      dataType: 'string',
      // Using DevExtreme-specific properties requires type assertion
      validationRules: [{ type: 'required' }, { type: 'stringLength', max: 100 }],
      editorOptions: {
        maxLength: 100
      }
    },
    {
      dataField: 'displayName',
      caption: 'Display Name',
      dataType: 'string',
      validationRules: [{ type: 'required' }, { type: 'stringLength', max: 100 }],
      editorOptions: {
        maxLength: 100
      }
    },
    {
      dataField: 'description',
      caption: 'Description',
      dataType: 'string',
      validationRules: [{ type: 'stringLength', max: 500 }],
      editorOptions: {
        maxLength: 500
      }
    },
    {
      dataField: 'isSystemRole',
      caption: 'System Role',
      dataType: 'boolean',
      trueText: 'Yes',
      falseText: 'No',
      alignment: 'center',
      cellTemplate: (container, options) => {
        if (options.data.isSystemRole) {
          container.innerHTML = '<span class="system-role-badge">System</span>';
        } else {
          container.innerHTML = '<span class="custom-role-badge">Custom</span>';
        }
      }
    },
    {
      dataField: 'created',
      caption: 'Created',
      dataType: 'datetime',
      format: 'MM/dd/yyyy',
      allowEditing: false,
      hidingPriority: 1
    }
  ];
  
  // Return the columns with a type cast
  return columns as ODataGridColumn[];
};
