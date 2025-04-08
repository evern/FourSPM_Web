import ODataStore from 'devextreme/data/odata/store';
import { useAuth } from '../contexts/auth';
import { AREAS_ENDPOINT } from '../config/api-endpoints';
import { useMemo } from 'react';

/**
 * Custom hook to create a configured ODataStore with authentication
 * @param endpointPath The full path to the OData endpoint (including base URL)
 * @param keyField The key field name for the entity
 * @param storeOptions Additional options to pass to the ODataStore constructor
 * @returns An ODataStore instance configured for the specified endpoint
 */
export const useODataStore = (endpointPath: string, keyField: string = 'guid', storeOptions: Record<string, any> = {}) => {
  const { user } = useAuth();
  
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
      beforeSend: (options: any) => {
        const token = user?.token;
        
        if (!token) {
          console.error('No token available');
          return false;
        }

        options.headers = {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        };

        if (options.method === 'PATCH') {
          options.headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
          options.headers['Prefer'] = 'return=minimal';
        }

        return true;
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
  }, [endpointPath, keyField, user?.token, JSON.stringify(storeOptions)]); // Only recreate the store when these dependencies change
};

/**
 * Custom hook to create an Area store with project filtering
 * @param projectId Project GUID to filter areas by
 * @returns DataSource configured for the areas or null if projectId is not provided
 */
export const useAreaStoreForProject = (projectId: string | null | undefined) => {
  // Always call hooks at the top level, before any conditionals
  const store = useODataStore(AREAS_ENDPOINT);
  
  // Use useMemo before any conditional returns
  const dataSource = useMemo(() => {
    if (!projectId) {
      return null;
    }
    
    return {
      store,
      filter: ['projectGuid', '=', projectId]
    };
  }, [store, projectId]); // Only recreate when store or projectId changes
  
  return dataSource;
};
