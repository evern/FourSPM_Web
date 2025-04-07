import { useEffect } from 'react';
import { Client } from '../types/odata-types';
import { CLIENTS_ENDPOINT } from '../config/api-endpoints';
import { useAuth } from '../contexts/auth';
import { compareGuids } from '../utils/guid-utils';

// Private cache that exists at the module level
let clientsCache: Client[] | null = null;
let authToken: string | null = null;
let isLoading = false;
let dataLoadedPromise: Promise<Client[]> | null = null;

/**
 * Function to update the token when auth changes
 * Called internally by the hook
 */
export function updateClientDataSourceToken(token: string | null) {
  authToken = token;
}

/**
 * The singleton data source object that implements the DevExtreme data source interface
 * This is a true singleton that exists outside the React component lifecycle
 */
export const clientDataSource = {
  /**
   * Check if data is currently loading
   * @returns True if data is being loaded, false otherwise
   */
  isLoading: function() {
    return isLoading;
  },
  
  /**
   * Returns a promise that resolves when data is loaded
   * This is essential to wait for data before rendering components
   */
  waitForData: function() {
    // If we already have data, resolve immediately
    if (clientsCache) {
      return Promise.resolve(clientsCache);
    }
    
    // If we're currently loading, return the existing promise
    if (isLoading && dataLoadedPromise) {
      return dataLoadedPromise;
    }
    
    // If no load has been initiated yet, start one
    if (!isLoading) {
      dataLoadedPromise = this.load({}) as Promise<Client[]>;
      return dataLoadedPromise;
    }
    
    // Fallback - should never reach here
    return Promise.resolve([]);
  },
  
  load: function(loadOptions: any) {
    // If we already have data cached, return it immediately
    if (clientsCache) {

      return Promise.resolve(clientsCache);
    }
    
    // Handle case where token might not be ready yet
    if (!authToken) {

      // Set loading state
      isLoading = true;
      
      // Return a promise that waits for the token
      return new Promise((resolve) => {
        // Wait a short time to allow token to be set
        setTimeout(() => {

          // If we have a token now, proceed with the request
          if (authToken) {
            fetch(CLIENTS_ENDPOINT, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            })
            .then(response => response.json())
            .then(data => {
              // Cache the data for future use
              clientsCache = data.value || data;
              isLoading = false;
              resolve(clientsCache);
            })
            .catch(error => {
  
              isLoading = false;
              resolve([]);
            });
          } else {
            // Still no token, return empty array

            isLoading = false;
            resolve([]);
          }
        }, 500); // 500ms delay to allow token to be registered
      });
    }
    
    // Normal case - token is available

    isLoading = true;
    
    return fetch(CLIENTS_ENDPOINT, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      // Cache the data for future use
      clientsCache = data.value || data;
      isLoading = false;
      return clientsCache;
    })
    .catch(error => {
      console.error('[ClientDataSource] Error loading data:', error);
      isLoading = false;
      return [];
    });
  },
  
  byKey: function(key: string) {
    // If we have the cache, find the item by key
    if (clientsCache) {

      const item = clientsCache.find(client => compareGuids(client.guid, key));
      return Promise.resolve(item);
    }
    
    // Handle case where token might not be ready yet
    if (!authToken) {

      // Return a promise that waits for the token
      return new Promise((resolve) => {
        // Wait a short time to allow token to be set
        setTimeout(() => {
          if (authToken) {
            const keyFilterUrl = `${CLIENTS_ENDPOINT}?$filter=guid eq '${key}'`;
            fetch(keyFilterUrl, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            })
            .then(response => response.json())
            .then(data => {
              const items = data.value || data;
              resolve(items.length > 0 ? items[0] : null);
            });
          } else {
            // Still no token, return null

            resolve(null);
          }
        }, 500);
      });
    }
    
    // Normal case - token is available

    const keyFilterUrl = `${CLIENTS_ENDPOINT}?$filter=guid eq '${key}'`;
    return fetch(keyFilterUrl, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      const items = data.value || data;
      return items.length > 0 ? items[0] : null;
    });
  },
  
  // Method to manually clear the cache if needed
  clearCache: function() {
    clientsCache = null;

  }
};

/**
 * Hook to use the singleton client data source with React
 * This hook only updates the auth token, it doesn't recreate the data source
 * @returns The singleton client data source
 */
export function useClientDataSource() {
  const { user } = useAuth();
  
  // Update the token whenever auth changes
  useEffect(() => {

    updateClientDataSourceToken(user?.token || null);
  }, [user?.token]);
  
  // Preload the client data when the hook is first used and token is available
  useEffect(() => {
    if (user?.token && !clientsCache && !clientDataSource.isLoading()) {

      // Small delay to ensure token is properly registered
      setTimeout(() => {
        clientDataSource.load({}).catch(err => {

        });
      }, 100);
    }
  }, [user?.token]);
  
  return clientDataSource;
}
