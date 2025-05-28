import { useQuery } from '@tanstack/react-query';
import { Client } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';
import ODataStore from 'devextreme/data/odata/store';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';

type ClientWithAliases = Client & {
  clientNumber?: string; // Add alias for compatibility with other components
};

const fetchClients = async (token?: string | null): Promise<Client[]> => {
  const requestOptions = {
    method: 'GET'
  } as any;

  if (token) {
    requestOptions.token = token;
  }
  
  const response = await baseApiService.request(CLIENTS_ENDPOINT, requestOptions);
  const data = await response.json();
  return data.value || [];
};

export interface ClientDataProviderResult {
  clients: ClientWithAliases[];
  clientsStore: ODataStore;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

export const useClientDataProvider = (): ClientDataProviderResult => {
  const clientsStore = useODataStore(CLIENTS_ENDPOINT, 'guid', {
    fieldTypes: {
      number: 'string',
      clientGuid: 'Guid'
    }
  });

  const { 
    data: clientsData = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetchClients(getToken()),
    select: (data: Client[]) => data,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000,
    enabled: true
  });
  
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