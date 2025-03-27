import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Client } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';

/**
 * Interface for client data provider result
 */
export interface ClientDataProviderResult {
  clients: Client[];
  clientsStore: ODataStore;
  clientsDataSource: any; // DataSource for lookup components
  isLoading: boolean;
  error: Error | null;
  getClientById: (id: string) => Client | undefined;
  getClientByCode: (code: string) => Client | undefined;
}

/**
 * Data provider hook for client data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the clients store, data array, loading state, and helper methods
 */
export const useClientDataProvider = (): ClientDataProviderResult => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Use the hook to get the store
  const clientsStore = useODataStore(CLIENTS_ENDPOINT);
  
  // Create a DataSource for lookups
  const clientsDataSource = useMemo(() => {
    return {
      store: clientsStore
    };
  }, [clientsStore]);
  
  // Load data from store on component mount
  useEffect(() => {
    // Only load once unless the store reference actually changes
    if (!initialLoadCompleted.current) {
      setIsLoading(true);
      clientsStore.load()
        .then((data: Client[]) => {
          setClients(data);
          setIsLoading(false);
          initialLoadCompleted.current = true;
        })
        .catch((err: Error) => {
          console.error('Error loading clients:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [clientsStore]); // The dependency here is fine now that clientsStore is memoized
  
  /**
   * Get a client by its ID
   * @param id The client ID to look for
   * @returns The client object or undefined if not found
   */
  const getClientById = useCallback((id: string): Client | undefined => {
    return clients.find(client => compareGuids(client.guid, id));
  }, [clients]);

  /**
   * Get a client by its code
   * @param code The client code to look for
   * @returns The client object or undefined if not found
   */
  const getClientByCode = useCallback((code: string): Client | undefined => {
    return clients.find(client => client.code === code);
  }, [clients]);

  return {
    clients,
    clientsStore,
    clientsDataSource,
    isLoading,
    error,
    getClientById,
    getClientByCode
  };
};
