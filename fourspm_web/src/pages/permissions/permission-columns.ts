import type { ODataGridColumn } from '../../components';
import { PermissionType } from '../../contexts/permissions/permissions-types';

/**
 * Interface for the permission columns configuration
 */
export interface PermissionColumnsConfig {
  setAccessLevel: (featureKey: string, action: string, skipStateUpdate?: boolean) => Promise<boolean>; // 'NoAccess', 'ReadOnly', 'FullAccess'
  setToggleState: (featureKey: string, enabled: boolean, skipStateUpdate?: boolean) => Promise<boolean>; // true/false
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  canEditRoles?: () => boolean; // Optional function to check if user has permission to edit roles
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
          onClick: async (e: any) => {
            // Check if user has edit permissions
            if (config.canEditRoles && !config.canEditRoles()) {
              config.showError('You do not have permission to edit role permissions');
              return;
            }
            
            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              try {
                const success = await config.setAccessLevel(featureKey, 'NoAccess', true); // Skip state update since grid will refresh
                if (success) {
                  config.showSuccess(`Permission for ${displayName} set to No Access`);
                  e.component.refresh(); // Refresh the grid to show updated permission levels
                }
              } catch (error: any) {
                config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
              }
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
          onClick: async (e: any) => {
            // Check if user has edit permissions
            if (config.canEditRoles && !config.canEditRoles()) {
              config.showError('You do not have permission to edit role permissions');
              return;
            }
            
            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              try {
                const success = await config.setAccessLevel(featureKey, 'ReadOnly', true); // Skip state update since grid will refresh
                if (success) {
                  config.showSuccess(`Permission for ${displayName} set to Read-Only`);
                  e.component.refresh(); // Refresh the grid to show updated permission levels
                }
              } catch (error: any) {
                config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
              }
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
          onClick: async (e: any) => {
            // Check if user has edit permissions
            if (config.canEditRoles && !config.canEditRoles()) {
              config.showError('You do not have permission to edit role permissions');
              return;
            }

            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              try {
                const success = await config.setAccessLevel(featureKey, 'FullAccess', true); // Skip state update since grid will refresh
                if (success) {
                  config.showSuccess(`Permission for ${displayName} set to Full Access`);
                  e.component.refresh(); // Refresh the grid to show updated permission levels
                }
              } catch (error: any) {
                config.showError(`Failed to update permission: ${error.message || 'Unknown error'}`);
              }
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
          onClick: async (e: any) => {
            // Check if user has edit permissions
            if (config.canEditRoles && !config.canEditRoles()) {
              config.showError('You do not have permission to edit role permissions');
              return;
            }

            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              try {
                const success = await config.setToggleState(featureKey, false, true); // Skip state update since grid will refresh
                if (success) {
                  config.showSuccess(`${displayName} disabled`);
                  e.component.refresh(); // Refresh the grid to show updated permission levels
                }
              } catch (error: any) {
                config.showError(`Failed to disable ${displayName}: ${error.message || 'Unknown error'}`);
              }
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
          onClick: async (e: any) => {
            // Check if user has edit permissions
            if (config.canEditRoles && !config.canEditRoles()) {
              config.showError('You do not have permission to edit role permissions');
              return;
            }

            if (e.row?.data) {
              const { featureKey, displayName } = e.row.data;
              try {
                const success = await config.setToggleState(featureKey, true, true); // Skip state update since grid will refresh
                if (success) {
                  config.showSuccess(`${displayName} enabled`);
                  e.component.refresh(); // Refresh the grid to show updated permission levels
                }
              } catch (error: any) {
                config.showError(`Failed to enable ${displayName}: ${error.message || 'Unknown error'}`);
              }
            }
          }
        }
      
      ]
    }
  ];
  
  // Return the columns with a type cast
  return columns as ODataGridColumn[];
};
