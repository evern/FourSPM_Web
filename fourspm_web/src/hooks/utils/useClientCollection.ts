import { getClients } from '../../adapters/client.adapter';
import { Client } from '../../types/odata-types';
import { createDataFetchingHook, DataFetchingResult } from '../factories/createDataFetchingHook';
import ODataStore from 'devextreme/data/odata/store';

/**
 * Interface for client collection hook result
 */
export interface ClientCollectionResult extends Omit<DataFetchingResult<Client[]>, 'data'> {
  clients: Client[];
}

/**
 * Wrapper for client fetching that handles optional token
 */
const fetchClientsWithOptionalToken = async (userToken?: string): Promise<Client[]> => {
  if (!userToken) return [];
  return getClients(userToken);
};

/**
 * Create the base hook using the factory
 */
const useBaseClientCollection = createDataFetchingHook<Client[], [string?]>(
  fetchClientsWithOptionalToken
);

/**
 * Hook for accessing client data in a standardized way
 * Now provides both in-memory data (clients) and ODataStore (clientsStore) for grid binding
 * @param userToken User's authentication token
 * @returns Object containing clients data, store, loading state, and error
 */
export const useClientCollection = (userToken?: string): ClientCollectionResult => {
  const { data, isLoading, error } = useBaseClientCollection(userToken);
  
  return {
    clients: data || [],
    isLoading,
    error
  };
};
