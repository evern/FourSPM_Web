/**
 * Global DevExtreme configuration settings
 */

import config from 'devextreme/core/config';
import dxDataGrid from 'devextreme/ui/data_grid';
import ajax from 'devextreme/core/utils/ajax';

// Configure global DevExtreme settings
export const configureDevExtreme = (): void => {
  // Configure general DevExtreme settings
  config({
    useLegacyStoreResult: false,
    useLegacyVisibleIndex: false
  });

  // Disable error row display globally for all DataGrid instances
  dxDataGrid.defaultOptions({
    device: { deviceType: 'desktop' },
    options: {
      errorRowEnabled: false,
      showErrorRow: false,
      showBorders: true
    }
  });

  // Set up global AJAX error handler to prevent default error displays
  ajax.defaultSettings = {
    ...ajax.defaultSettings,
    cache: false,
    xhrFields: {
      withCredentials: true
    },
    error: () => {
      // Return true to prevent default error handling
      return true;
    }
  };
};
