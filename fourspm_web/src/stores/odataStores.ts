import ODataStore from 'devextreme/data/odata/store';
import { useMemo } from 'react';
import { useToken } from '../contexts/token-context';

/**
 * Custom hook to create a configured ODataStore with authentication
 * @param endpointPath The full path to the OData endpoint (including base URL)
 * @param keyField The key field name for the entity
 * @param storeOptions Additional options to pass to the ODataStore constructor
 * @returns An ODataStore instance configured for the specified endpoint
 */
export const useODataStore = (
  endpointPath: string, 
  keyField: string = 'guid', 
  storeOptions: Record<string, any> = {}
) => {
  // Use the token context - token acquisition is now handled by the TokenProvider
  const { token } = useToken();
  
  // Use useMemo to prevent creating a new store on every render
  return useMemo(() => {
    // Create the store instance
    const store = new ODataStore({
      url: endpointPath, // Endpoint already includes the base URL from api-endpoints.ts
      version: 4,
      key: keyField,
      keyType: 'Guid',
      // Default fieldTypes to ensure GUIDs are handled properly
      fieldTypes: {
        projectGuid: 'Guid',
        ...(storeOptions.fieldTypes || {})
      },
      ...storeOptions,
      withCredentials: false,
      beforeSend: async (options: any) => {
        console.log('ODataStore: beforeSend called');
        
        try {
          // Use the token from context - token acquisition is now handled by the TokenProvider
          if (!token) {
            console.error('ODataStore: No valid token available!');
            // Let the request proceed without a token - it will likely 401 but this helps debugging
            // Alternatively, uncomment the next line to prevent the request entirely
            // return false;
          } else {
            console.log('ODataStore: Using token from context');
            // Initialize headers if they don't exist
            if (!options.headers) {
              options.headers = {};
            }

            // Add the token to the Authorization header
            options.headers['Authorization'] = `Bearer ${token}`;
          } 
          console.log(`ODataStore: Added Authorization header to ${options.method} ${options.url}`);
          options.headers['Accept'] = 'application/json';

          if (options.method === 'PATCH') {
            options.headers['Content-Type'] = 'application/json';
          }

          return true;
        } catch (error) {
          console.error('ODataStore: Error in beforeSend:', error);
          
          // Let the request proceed without a token - it will likely 401 but this helps debugging
          return true;
        }
      },
      errorHandler: (error) => {
        if (error.httpStatus === 401) {
          console.log('ODataStore: 401 Unauthorized error detected in errorHandler');
          
          // Don't redirect here - the ODataGrid will handle token refresh
          // The 401 will trigger ODataGrid's error handler which will refresh the token
          // and update our token store
          
          // Just indicate that we're handling the error
          return true;
        }
        return false;
      }
    });
    
    return store;
  }, [endpointPath, keyField, token, storeOptions]); // Only recreate the store when these dependencies change
};
