

import config from 'devextreme/core/config';
import dxDataGrid from 'devextreme/ui/data_grid';
import ajax from 'devextreme/core/utils/ajax';


export const configureDevExtreme = (): void => {

  config({
    useLegacyStoreResult: false,
    useLegacyVisibleIndex: false
  });


  dxDataGrid.defaultOptions({
    device: { deviceType: 'desktop' },
    options: {
      errorRowEnabled: false,
      showErrorRow: false,
      showBorders: true
    }
  });


  ajax.defaultSettings = {
    ...ajax.defaultSettings,
    cache: false,
    xhrFields: {
      withCredentials: true
    },
    error: () => {

      return true;
    }
  };
};
