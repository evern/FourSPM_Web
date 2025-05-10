import { useQuery } from '@tanstack/react-query';
import { Client } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';
import { baseApiService } from '../../api/base-api.service';

/**
 * Fetch clients data from the API
 * @returns Promise with array of clients
 */
const fetchClients = async (): Promise<Client[]> => {
  const response = await baseApiService.request(CLIENTS_ENDPOINT);
  const data = await response.json();
  return data.value || [];
};

/**
 * Result interface for the client data provider hook
 */
export interface ClientDataProviderResult {
  clients: Client[];
  clientsStore: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Data provider hook for client data
 * @returns Object containing the clients store, data array, and loading state
 */
export const useClientDataProvider = (): ClientDataProviderResult => {
  // Create a global store for direct OData operations
  const clientsStore = useODataStore(CLIENTS_ENDPOINT, 'guid');

  // Use React Query to fetch and cache clients
  const { 
    data: clients = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients
  });
  
  const error = queryError as Error | null;

  return {
    clients,
    clientsStore,
    isLoading,
    error,
    refetch
  };
};