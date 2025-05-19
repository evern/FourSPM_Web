import ODataStore from 'devextreme/data/odata/store';
import { useMSALAuth } from '../contexts/msal-auth';
import { useMemo } from 'react';

/**
 * Custom hook to create a configured ODataStore with authentication
 * @param endpointPath The full path to the OData endpoint (including base URL)
 * @param keyField The key field name for the entity
 * @param storeOptions Additional options to pass to the ODataStore constructor
 * @returns An ODataStore instance configured for the specified endpoint
 */
export const useODataStore = (endpointPath: string, keyField: string = 'guid', storeOptions: Record<string, any> = {}) => {
  const { acquireToken } = useMSALAuth();
  
  // Use useMemo to prevent creating a new store on every render
  return useMemo(() => {
    return new ODataStore({
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
      beforeSend: async (options: any) => {
        try {
          // Dynamically acquire a token using MSAL
          const authToken = await acquireToken();
          
          if (!authToken) {
            console.error('No token available for API request');
            return false;
          }
          
          // Initialize headers if they don't exist
          if (!options.headers) {
            options.headers = {};
          }

          // Add authorization headers without overwriting the entire headers object
          options.headers['Authorization'] = `Bearer ${authToken}`;
          options.headers['Accept'] = 'application/json';

          if (options.method === 'PATCH') {
            options.headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
            options.headers['Prefer'] = 'return=minimal';
          }
          
          return true;
        } catch (error) {
          console.error('Error acquiring token:', error);
          return false;
        }
      },
      errorHandler: (error) => {
        if (error.httpStatus === 401) {
          // Handle token expiration - redirect to login
          // No need to clear localStorage as AuthContext will handle this
          window.location.href = '/login';
          return true;
        }
        return false;
      }
    });
  }, [endpointPath, keyField, acquireToken, storeOptions]); // Only recreate the store when these dependencies change
};
