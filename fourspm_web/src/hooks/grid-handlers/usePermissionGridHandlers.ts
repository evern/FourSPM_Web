import { useCallback } from 'react';
import { usePermissions } from '../../contexts/permissions/permissions-context';
import { PermissionLevel } from '../../contexts/permissions/permissions-types';

/**
 * Hook for managing permission grid interactions
 * Follows the established pattern for grid handlers in the application
 */
export const usePermissionGridHandlers = () => {
  // Use the permissions context
  const { setPermissionLevel, getPermissionLevel } = usePermissions();
  
  // Handle permission level changes
  const handlePermissionLevelChange = useCallback(
    async (featureKey: string, level: PermissionLevel): Promise<void> => {
      return setPermissionLevel(featureKey, level);
    },
    [setPermissionLevel]
  );
  
  // Handle editor preparing to disable standard editing
  const handleEditorPreparing = useCallback((e: any) => {
    // Disable editing for all standard column cells
    // The permission level will be controlled through custom template
    if (e.parentType === 'dataRow') {
      e.editorOptions.readOnly = true;
    }
  }, []);
  
  // Override standard grid operations to prevent CRUD on permissions
  const handleRowUpdating = useCallback((e: any) => {
    // Cancel default update behavior
    e.cancel = true;
  }, []);
  
  const handleRowInserting = useCallback((e: any) => {
    // Cancel default insert behavior
    e.cancel = true;
  }, []);
  
  const handleRowRemoving = useCallback((e: any) => {
    // Cancel default delete behavior
    e.cancel = true;
  }, []);
  
  return {
    handlePermissionLevelChange,
    handleEditorPreparing,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    getPermissionLevel
  };
};
