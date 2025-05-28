/**
 * Global DevExtreme configuration settings
 */

import dxDataGrid from 'devextreme/ui/data_grid';

// Disable error row display globally for all DataGrid instances
dxDataGrid.defaultOptions({
  device: { deviceType: 'desktop' },
  options: {
    errorRowEnabled: false,
    showErrorRow: false,
    showBorders: true
  }
});

// Configure data grid to use our error handling approach
export const configureDevExtreme = () => {
  // This function can be called from the app entry point

};
