import type { ODataGridColumn } from '../../components';
import { Role } from '../../contexts/roles/roles-types';
import { alert } from 'devextreme/ui/dialog';

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
            // Check if this is a system role
            if (e.row.data.isSystemRole) {
              // Show dialog for system roles
              alert(
                'Permissions for system roles cannot be managed because system roles have all permissions granted by default.',
                'System Role Permissions'
              );
            } else {
              // Navigate to the role permissions component for non-system roles
              window.location.href = `#/roles/${e.row.data.guid}/permissions`;
            }
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
      hint: 'Enabling this will grant all permissions'
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
