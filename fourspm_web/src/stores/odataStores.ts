import ODataStore from 'devextreme/data/odata/store';
import { API_CONFIG } from '../config/api';

/**
 * Helper function to create a configured ODataStore with authentication
 * @param endpointPath The relative path to the OData endpoint
 * @param keyField The key field name for the entity
 * @returns An ODataStore instance configured for the specified endpoint
 */
export const createODataStore = (endpointPath: string, keyField: string = 'guid') => {
  return new ODataStore({
    url: `${API_CONFIG.baseUrl}${endpointPath}`,
    version: 4,
    key: keyField,
    keyType: 'Guid',
    beforeSend: (options: any) => {
      const token = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user') || '{}').token : null;
      
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
        console.log('Token expired, redirecting to login...');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return true;
      }
      return false;
    }
  });
};

// Pre-configured OData stores for common entities
export const clientsStore = createODataStore('/odata/v1/Clients');
export const deliverableGatesStore = createODataStore('/odata/v1/DeliverableGates');
export const deliverablesStore = createODataStore('/odata/v1/Deliverables');
export const projectsStore = createODataStore('/odata/v1/Projects');
export const documentTypesStore = createODataStore('/odata/v1/DocumentTypes');
export const areasStore = createODataStore('/odata/v1/Areas');
export const disciplinesStore = createODataStore('/odata/v1/Disciplines');

/**
 * Creates an Area store with project filtering
 * @param projectId Project GUID to filter areas by
 * @returns DataSource with ODataStore and project filter
 */
export const createAreaStore = (projectId: string) => {
  if (!projectId) {
    console.error('No projectId provided for Areas lookup');
    return null;
  }

  const store = createODataStore('/odata/v1/Areas');
  
  // Return a DataSource with filtering
  return {
    store: store,
    filter: ['projectGuid', '=', projectId]
  };
};
