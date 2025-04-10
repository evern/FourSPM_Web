import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Client } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { useAuth } from '../../contexts/auth';
import { CLIENTS_ENDPOINT } from '../../config/api-endpoints';

// Module-level cache to ensure it's shared across ALL instances
// This is key to preventing multiple requests
let clientsGlobalCache: Client[] | null = null;

// Flag to track if we're currently loading client data
// This prevents duplicate API calls when multiple components initialize simultaneously
let isLoadingClients = false;

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
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);

  // Standard ODataStore for grid operations (not used for lookups)
  const clientsStore = useODataStore(CLIENTS_ENDPOINT);
  
  /**
   * Create a custom store for efficient lookups
   * This leverages the global cache and prevents multiple requests
   */
  const clientsDataSource = useMemo(() => {
    // Create the lookup data source with optimized load/byKey methods
    return {
      load: function(loadOptions: any) {
        // If global cache already has data, use it immediately
        if (clientsGlobalCache) {
          // Using global cache for load
          return Promise.resolve(clientsGlobalCache);
        }
        
        // If we already loaded data into component state, update global cache and return
        if (clients.length > 0 && !isLoading) {
          // Using component state for load
          clientsGlobalCache = clients;
          return Promise.resolve(clients);
        }
        
        // Check if another instance is already loading
        if (isLoadingClients) {
          // Wait for the existing request to complete and use its results
          return new Promise<Client[]>((resolve) => {
            const checkCacheInterval = setInterval(() => {
              if (!isLoadingClients && clientsGlobalCache) {
                clearInterval(checkCacheInterval);
                resolve(clientsGlobalCache);
                
                // Update component state if needed
                if (!initialLoadCompleted.current) {
                  setClients(clientsGlobalCache);
                  setIsLoading(false);
                  initialLoadCompleted.current = true;
                }
              }
            }, 100);
          });
        }
        
        // Set the loading flag to prevent duplicate requests
        isLoadingClients = true;
        
        // Otherwise make a direct fetch to avoid ODataStore overhead
        // No cache available - fetching from server
        return fetch(CLIENTS_ENDPOINT, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const clientsData = data.value || data;
          
          // Update both global cache and component state
          clientsGlobalCache = clientsData;
          if (!initialLoadCompleted.current) {
            setClients(clientsData);
            setIsLoading(false);
            initialLoadCompleted.current = true;
          }
          
          // Clear the loading flag
          isLoadingClients = false;
          
          return clientsData;
        })
        .catch(err => {
          console.error('[ClientProvider] Error loading client data:', err);
          setError(err as Error);
          setIsLoading(false);
          
          // Clear the loading flag on error too
          isLoadingClients = false;
          
          return [];
        });
      },

      byKey: function(key: string) {
        // Always check global cache first (most efficient)
        if (clientsGlobalCache) {
          // Looking up client from global cache
          const item = clientsGlobalCache.find(client => compareGuids(client.guid, key));
          return Promise.resolve(item);
        }
        
        // If we have clients in component state but not in global cache (shouldn't happen)
        if (clients.length > 0) {
          // Looking up client from component state
          const item = clients.find(client => compareGuids(client.guid, key));
          
          // Update global cache for future lookups
          if (!clientsGlobalCache) {
            clientsGlobalCache = clients;
          }
          
          return Promise.resolve(item);
        }
        
        // If no cache available, fetch just the one client by key
        // Looking up client from server
        const keyFilterUrl = `${CLIENTS_ENDPOINT}?$filter=guid eq '${key}'`;
        return fetch(keyFilterUrl, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const items = data.value || data;
          return items.length > 0 ? items[0] : null;
        });
      }
    };
  }, [user?.token, clients, isLoading]);
  
  // Initial data loading (if needed)
  useEffect(() => {
    // If we already have global cache data, use it and skip the request
    if (clientsGlobalCache && !initialLoadCompleted.current) {
      // Using global cache for initial load
      setClients(clientsGlobalCache);
      setIsLoading(false);
      initialLoadCompleted.current = true;
      return;
    }
    
    // Only load once unless forced
    if (!initialLoadCompleted.current) {
      // Initial client data load
      setIsLoading(true);
      
      // Use the data source load method to ensure cache is populated
      clientsDataSource.load({})
        .then((data: Client[]) => {
          // Data and state updates are handled in the load method
        })
        .catch((err: Error) => {
          console.error('[ClientProvider] Error in initial load:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [clientsDataSource]); // Only run on initial mount or when token changes
  
  /**
   * Get a client by its ID
   * @param id The client ID to look for
   * @returns The client object or undefined if not found
   */
  const getClientById = useCallback((id: string): Client | undefined => {
    // Check global cache first for best performance
    if (clientsGlobalCache) {
      return clientsGlobalCache.find(client => compareGuids(client.guid, id));
    }
    return clients.find(client => compareGuids(client.guid, id));
  }, [clients]);

  /**
   * Get a client by its code
   * @param code The client code to look for
   * @returns The client object or undefined if not found
   */
  const getClientByCode = useCallback((code: string): Client | undefined => {
    // Check global cache first for best performance
    if (clientsGlobalCache) {
      return clientsGlobalCache.find(client => client.code === code);
    }
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
