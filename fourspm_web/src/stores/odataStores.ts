import ODataStore from 'devextreme/data/odata/store';
import { useMemo } from 'react';
import { getToken } from '../utils/token-store';


export const useODataStore = (
  endpointPath: string, 
  keyField: string = 'guid', 
  storeOptions: Record<string, any> = {}
) => {

  return useMemo(() => {

    const store = new ODataStore({
      url: endpointPath,
      version: 4,
      key: keyField,
      keyType: 'Guid',

      fieldTypes: {
        projectGuid: 'Guid',
        ...(storeOptions.fieldTypes || {})
      },
      ...storeOptions,
      withCredentials: false,
      beforeSend: async (options: any) => {

        
        try {

          const token = getToken();
          if (!token) {
            console.error('ODataStore: No valid token available!');
          } else {


            if (!options.headers) {
              options.headers = {};
            }


            options.headers['Authorization'] = `Bearer ${token}`;


            const method = options.method ? options.method.toLowerCase() : 'get';
            if (['post', 'put', 'patch'].includes(method)) {
              options.headers['Content-Type'] = 'application/json;odata.metadata=minimal';
              options.headers['Prefer'] = 'return=representation';
            }
            options.headers['Accept'] = 'application/json';


          } 
          return true;
        } catch (error) {
          console.error('ODataStore: Error in beforeSend:', error);
          return true;
        }
      },
      errorHandler: (error) => {
        if (error.httpStatus === 401) {
          return true;
        }
        return false;
      }
    });
    
    return store;
  }, [endpointPath, keyField, storeOptions]);
};
