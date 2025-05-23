import { useQuery } from '@tanstack/react-query';
import { Client } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';
import ODataStore from 'devextreme/data/odata/store';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';

// This helps us normalize field names between Client entities and other components
type ClientWithAliases = Client & {
  clientNumber?: string; // Add alias for compatibility with other components
};

/**
 * Fetch clients data from the API
 * @param token Optional token - can be string, null, or undefined
 * @returns Promise with array of clients
 */
const fetchClients = async (token?: string | null): Promise<Client[]> => {
  // Ensure we have a valid API request configuration
  const requestOptions = {
    method: 'GET'
  } as any;
  
  // Add token if available
  if (token) {
    requestOptions.token = token;
  }
  
  const response = await baseApiService.request(CLIENTS_ENDPOINT, requestOptions);
  const data = await response.json();
  return data.value || [];
};

/**
 * Result interface for the client data provider hook
 */
export interface ClientDataProviderResult {
  clients: ClientWithAliases[];
  clientsStore: ODataStore;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Data provider hook for client data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * Uses React Query for efficient data fetching and caching
 * 
 * @returns Object containing the clients store, data array, loading state, and helper methods
 */
export const useClientDataProvider = (): ClientDataProviderResult => {
  // Using Optimized Direct Access Pattern - token is retrieved directly in leaf methods
  // Create a store for OData operations - this is used when we need direct grid operations
  const clientsStore = useODataStore(CLIENTS_ENDPOINT, 'guid', {
    fieldTypes: {
      number: 'string', // The client number is a string, not a number
      clientGuid: 'Guid' // This ensures proper serialization of GUID values in filters
    }
  });
  
  // Use React Query to fetch and cache clients - token access is optimized
  const { 
    data: clientsData = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['clients'], // No token dependency in query key - using Optimized Direct Access Pattern
    queryFn: () => fetchClients(getToken()), // Get token directly at the point of use
    select: (data: Client[]) => data,
    refetchOnWindowFocus: true, // Refetch data when the window regains focus
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    enabled: true // Always enabled - token check is done inside fetchClients
  });
  
  // Use the transformed data from React Query
  const clients = clientsData as ClientWithAliases[];
  const error = queryError as Error | null;

  return {
    clients,
    clientsStore,
    isLoading,
    error,
    refetch
  };
};