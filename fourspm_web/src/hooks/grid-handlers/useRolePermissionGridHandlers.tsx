import React, { useCallback, useMemo } from 'react';
import { usePermissions } from '../../contexts/permissions/permissions-context';
import { PermissionLevel } from '../../contexts/permissions/permissions-types';
import notify from 'devextreme/ui/notify';
import { Switch } from 'devextreme-react/switch';

/**
 * Permission type for future-proofing the permission system
 * Currently only AccessLevel is used, but Toggle will be added in the future
 */
export enum PermissionType {
  AccessLevel = 'AccessLevel',
  Toggle = 'Toggle'
}

/**
 * PermissionLevelCell component to display permission level with appropriate styles
 */
export const PermissionLevelCell = ({ level }: { level: number }) => {
  let levelText = 'Unknown';
  let className = '';
  
  switch (level) {
    case 0:
      levelText = 'No Access';
      className = 'permission-none';
      break;
    case 1:
      levelText = 'Read-Only';
      className = 'permission-readonly';
      break;
    case 2:
      levelText = 'Full Access';
      className = 'permission-full';
      break;
  }
  
  return <div className={`permission-level ${className}`}>{levelText}</div>;
};

/**
 * Props interface for TogglePermissionCell component
 */
export interface TogglePermissionCellProps {
  featureKey: string;
  isEnabled: boolean;
  displayName: string;
  onChange: (featureKey: string, newLevel: number, displayName: string) => void;
}

/**
 * TogglePermissionCell component to display and handle toggle permissions
 */
export const TogglePermissionCell = ({
  featureKey,
  isEnabled,
  displayName,
  onChange
}: TogglePermissionCellProps) => {
  const handleValueChange = (e: any) => {
    const newLevel = e.value ? 1 : 0; // 1 for enabled, 0 for disabled
    onChange(featureKey, newLevel, displayName);
  };
  
  return (
    <div className="permission-toggle-container">
      <Switch 
        value={isEnabled} 
        onValueChanged={handleValueChange}
        width={48}
        height={24}
      />
      <span className={`permission-toggle-label ${isEnabled ? 'enabled' : 'disabled'}`}>
        {isEnabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
};

/**
 * Custom hook for handling role permission grid operations
 * Follows the Collection View Doctrine pattern with specialized grid handlers
 * @returns Object containing grid handler functions
 */
export const useRolePermissionGridHandlers = () => {
  // Use the permissions context
  const {
    state: { role, permissionAssignments },
    setPermissionLevel,
  } = usePermissions();

  /**
   * Determine the current permission level for a feature
   * @param featureKey Unique identifier for the feature
   * @returns PermissionLevel enum value
   */
  const getPermissionLevel = useCallback(
    (featureKey: string): PermissionLevel => {
      // If no assignments exist yet, return NONE
      if (!permissionAssignments || permissionAssignments.length === 0) {
        return PermissionLevel.NONE;
      }

      // Find view and edit permissions for this feature
      const viewPermission = permissionAssignments.find(
        (p) => p.featureKey === featureKey && p.viewPermissionGuid && !p.editPermissionGuid
      );
      const editPermission = permissionAssignments.find(
        (p) => p.featureKey === featureKey && p.editPermissionGuid
      );

      // Determine permission level based on assignments
      if (editPermission) {
        return PermissionLevel.FULL_ACCESS;
      } else if (viewPermission) {
        return PermissionLevel.READ_ONLY;
      } else {
        return PermissionLevel.NONE;
      }
    },
    [permissionAssignments]
  );

  /**
   * Show success notification
   * @param message Success message to display
   */
  const showSuccess = useCallback((message: string) => {
    notify({
      message: `Success: ${message}`,
      type: 'success',
      displayTime: 2000,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    });
  }, []);

  /**
   * Show error notification
   * @param message Error message to display
   */
  const showError = useCallback((message: string) => {
    notify({
      message: `Error: ${message}`,
      type: 'error',
      displayTime: 3500,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    });
  }, []);

  /**
   * Handle permission level changes from the grid
   * Enhanced to support both access level and toggle-type permissions
   * 
   * @param featureKey Unique identifier for the feature
   * @param level New permission level to set
   * @param permissionType Type of permission (AccessLevel or Toggle)
   * @param displayName Display name of the feature for notifications
   * @returns Promise resolving when the operation completes
   */
  const handlePermissionLevelChange = useCallback(
    async (featureKey: string, level: PermissionLevel, permissionType?: string, displayName?: string): Promise<void> => {
      try {
        // Use the context's setPermissionLevel function
        await setPermissionLevel(featureKey, level);
        
        // If displayName is provided, show a success notification
        if (displayName) {
          // Format success message based on permission type
          let successMessage = '';
          
          if (permissionType === 'Toggle') {
            // Toggle permission success message
            const toggleState = level !== PermissionLevel.NONE ? 'enabled' : 'disabled';
            successMessage = `Permission for ${displayName} ${toggleState}`;
          } else {
            // Access level permission success message
            const levelText = level === PermissionLevel.NONE ? 'No Access' : 
                          level === PermissionLevel.READ_ONLY ? 'Read-Only' : 'Full Access';
            successMessage = `Permission for ${displayName} changed to ${levelText}`;
          }
          
          showSuccess(successMessage);
        }
      } catch (error) {
        // Show error notification if displayName is provided
        if (displayName) {
          showError(`Failed to update permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        console.error('Error updating permission level:', error);
        throw error; // Rethrow to allow calling code to handle the error
      }
    },
    [setPermissionLevel, showSuccess, showError]
  );

  /**
   * Handle toggle switch change
   * @returns Promise resolving when the toggle operation completes
   */
  const handleToggleChange = useCallback(
    (featureKey: string, newLevel: number, displayName: string): Promise<void> => {
      const permissionLevel = newLevel === 0 ? PermissionLevel.NONE : PermissionLevel.READ_ONLY;
      // Return the Promise from handlePermissionLevelChange
      return handlePermissionLevelChange(
        featureKey,
        permissionLevel,
        PermissionType.Toggle,
        displayName
      );
    },
    [handlePermissionLevelChange]
  );

  /**
   * Handle editor preparing event for the grid
   * Primarily used to disable editing for the grid
   */
  const handleEditorPreparing = useCallback((e: any) => {
    // Disable direct editing in the grid cells
    if (e.parentType === 'dataRow') {
      e.editorOptions.disabled = true;
    }
  }, []);
  
  /**
   * Standard row updating handler - not used for permissions
   * We use the custom permission buttons instead
   */
  const handleRowUpdating = useCallback((e: any) => {
    // Cancel standard update and use our custom handlers instead
    e.cancel = true;
  }, []);

  /**
   * Standard row inserting handler - prevent adding new permissions
   */
  const handleRowInserting = useCallback((e: any) => {
    // Cancel standard insertion - permissions are predefined
    e.cancel = true;
  }, []);

  /**
   * Standard row removing handler - prevent deleting permissions
   */
  const handleRowRemoving = useCallback((e: any) => {
    // Cancel standard deletion - permissions cannot be removed
    e.cancel = true;
  }, []);

  // Return functions and references necessary for grid handlers
  return {
    getPermissionLevel,
    handlePermissionLevelChange,
    handleToggleChange,
    handleEditorPreparing,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    showSuccess,
    showError
  };
};
