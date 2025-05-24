import type { ODataGridColumn } from '../../components';
import { PermissionLevel, PermissionType } from '../../contexts/permissions/permissions-types';

/**
 * Interface for the permission columns configuration
 */
export interface PermissionColumnsConfig {
  onPermissionLevelChange: (featureKey: string, level: PermissionLevel) => Promise<void>;
  onToggleChange: (featureKey: string, isEnabled: boolean, displayName: string) => Promise<void>;
  getPermissionLevel: (featureKey: string) => PermissionLevel;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

/**
 * Generate the columns for the Permissions grid
 * 
 * @param config Configuration for permission columns
 * @returns Array of ODataGridColumn for the grid
 */
export const permissionColumns = (config: PermissionColumnsConfig): ODataGridColumn[] => {
  // Cast columns to any to avoid type errors with DevExtreme properties
  // This follows the pattern used throughout the application
  const columns: any[] = [
    {
      dataField: 'displayName',
      caption: 'Feature',
      dataType: 'string',
      allowEditing: false,
      minWidth: 100
    },
    {
      dataField: 'description',
      caption: 'Description',
      dataType: 'string',
      allowEditing: false,
      minWidth: 150,
    },
    {
      // Use the permissionLevelText field directly from backend
      dataField: 'permissionLevelText',
      caption: 'Permission Level',
      width: 180,
      allowEditing: false,
    },
    {
      dataField: 'featureGroup',
      caption: 'Feature Group',
      dataType: 'string',
      visible: false,
      groupIndex: 0,
      allowEditing: false
    },
    {
      type: 'buttons',
      width: 110,
      alignment: 'center', // Center align the buttons for consistent spacing
      buttons: [
        // === ACCESS LEVEL PERMISSION BUTTONS ===

        // No Access button (AccessLevel only)
        {
          name: 'setNoAccess',
          hint: 'Set to No Access',
          icon: 'clear',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.AccessLevel;
          },
          onClick: (e: any) => {
            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              config.onPermissionLevelChange(featureKey, PermissionLevel.NONE)
                .then(() => {
                  config.showSuccess(`Permission for ${displayName} set to No Access`);
                })
                .catch((error: Error) => {
                  config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
                });
            }
          }
        },
        
        // Read-Only button (AccessLevel only)
        {
          name: 'setReadOnly',
          hint: 'Set to Read-Only',
          icon: 'find',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.AccessLevel;
          },
          onClick: (e: any) => {
            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              config.onPermissionLevelChange(featureKey, PermissionLevel.READ_ONLY)
                .then(() => {
                  config.showSuccess(`Permission for ${displayName} set to Read-Only`);
                })
                .catch((error: Error) => {
                  config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
                });
            }
          }
        },

        // Full Access button (AccessLevel only)
        {
          name: 'setFullAccess',
          hint: 'Set to Full Access',
          icon: 'edit',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.AccessLevel;
          },
          onClick: (e: any) => {
            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              config.onPermissionLevelChange(featureKey, PermissionLevel.FULL_ACCESS)
                .then(() => {
                  config.showSuccess(`Permission for ${displayName} set to Full Access`);
                })
                .catch((error: Error) => {
                  config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
                });
            }
          }
        },
        
        // === TOGGLE PERMISSION BUTTONS ===
        
        // Disable button (Toggle only)
        
        {
          name: 'toggleDisable',
          hint: 'Disable',
          icon: 'minus',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.Toggle;
          },
          onClick: (e: any) => {
            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              config.onToggleChange(featureKey, false, displayName)
                .then(() => {
                  config.showSuccess(`${displayName} disabled`);
                })
                .catch((error: Error) => {
                  config.showError(`Failed to disable ${displayName}: ${error.message || 'Unknown error'}`);
                });
            }
          }
        },
        
        // Enable button (Toggle only)
        {
          name: 'toggleEnable',
          hint: 'Enable',
          icon: 'add',
          visible: (e: any) => {
            if (!e || !e.row || !e.row.data) return false;
            const permissionType = e.row.data?.permissionType || PermissionType.AccessLevel;
            return permissionType === PermissionType.Toggle;
          },
          onClick: (e: any) => {
            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              config.onToggleChange(featureKey, true, displayName)
                .then(() => {
                  config.showSuccess(`${displayName} enabled`);
                })
                .catch((error: Error) => {
                  config.showError(`Failed to enable ${displayName}: ${error.message || 'Unknown error'}`);
                });
            }
          }
        }
      
      ]
    }
  ];
  
  // Return the columns with a type cast
  return columns as ODataGridColumn[];
};
