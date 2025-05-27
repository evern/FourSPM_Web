/**
 * Permission utilities for handling permission-based actions
 * This provides a reusable pattern for permission checking without modifying components
 */
import notify from 'devextreme/ui/notify';

/**
 * Higher-order function that wraps an action with permission checking
 * @param action The function to execute if permission check passes
 * @param permissionCheck Function that returns true if user has permission
 * @param errorMessage Custom error message to show if permission check fails
 * @returns A new function that checks permissions before executing the action
 */
export const withPermissionCheck = <T extends (...args: any[]) => any>(
  action: T,
  permissionCheck: () => boolean,
  errorMessage: string = 'You do not have permission to perform this action'
): ((...args: Parameters<T>) => ReturnType<T> | void) => {
  return (...args: Parameters<T>): ReturnType<T> | void => {
    // Check if user has permission
    if (!permissionCheck()) {
      // Show permission denied notification
      notify({
        message: errorMessage,
        type: 'warning',
        displayTime: 3000,
        position: { at: 'top center', my: 'top center' },
        width: 'auto',
        closeOnClick: true,
        closeOnOutsideClick: true
      });
      return;
    }
    
    // If user has permission, proceed with the action
    return action(...args);
  };
};

/**
 * Creates a notification for read-only access
 * @param feature The name of the feature with read-only access
 */
export const showReadOnlyNotification = (feature: string): void => {
  notify({
    message: `You have read-only access to ${feature}`,
    type: 'info',
    displayTime: 3000,
    position: { at: 'top center', my: 'top center' },
    width: 'auto',
    closeOnClick: true,
    closeOnOutsideClick: true
  });
};
