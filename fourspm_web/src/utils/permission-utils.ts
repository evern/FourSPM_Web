
import notify from 'devextreme/ui/notify';


export const withPermissionCheck = <T extends (...args: any[]) => any>(
  action: T,
  permissionCheck: () => boolean,
  errorMessage: string = 'You do not have permission to perform this action'
): ((...args: Parameters<T>) => ReturnType<T> | void) => {
  return (...args: Parameters<T>): ReturnType<T> | void => {

    if (!permissionCheck()) {

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
    

    return action(...args);
  };
};


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
