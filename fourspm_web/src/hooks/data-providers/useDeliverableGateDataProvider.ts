import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DeliverableGate } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { useAuth } from '../../contexts/auth';
import { DELIVERABLE_GATES_ENDPOINT } from '../../config/api-endpoints';

// Module-level cache to ensure it's shared across ALL instances
// This is key to preventing multiple requests
let gatesGlobalCache: DeliverableGate[] | null = null;

/**
 * Interface for deliverable gate data provider result
 */
export interface DeliverableGateDataProviderResult {
  gates: DeliverableGate[];
  gatesStore: ODataStore;
  gatesDataSource: any; // DataSource for lookup components
  isLoading: boolean;
  error: Error | null;
  getGateById: (id: string) => DeliverableGate | undefined;
  getGateBySequence: (sequence: number) => DeliverableGate | undefined;
}

/**
 * Data provider hook for deliverable gate data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the deliverable gates store, data array, loading state, and helper methods
 */
export const useDeliverableGateDataProvider = (): DeliverableGateDataProviderResult => {
  const { user } = useAuth();
  const [gates, setGates] = useState<DeliverableGate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);

  // Standard ODataStore for grid operations with proper field types
  const gatesStore = useODataStore(DELIVERABLE_GATES_ENDPOINT, 'guid', {
    fieldTypes: {
      guid: 'Guid',
      maxPercentage: 'Decimal',
      autoPercentage: 'Decimal'
    }
  });
  
  /**
   * Create a custom store for efficient lookups
   * This leverages the global cache and prevents multiple requests
   */
  const gatesDataSource = useMemo(() => {
    // Create the lookup data source with optimized load/byKey methods
    return {
      load: function(loadOptions: any) {
        // If global cache already has data, use it immediately
        if (gatesGlobalCache) {
          console.log('[GateProvider] Using global cache for load - no server request');
          return Promise.resolve(gatesGlobalCache);
        }
        
        // If we already loaded data into component state, update global cache and return
        if (gates.length > 0 && !isLoading) {
          console.log('[GateProvider] Using component state for load - no server request');
          gatesGlobalCache = gates;
          return Promise.resolve(gates);
        }
        
        // Otherwise make a direct fetch to avoid ODataStore overhead
        console.log('[GateProvider] No cache available - fetching from server');
        return fetch(DELIVERABLE_GATES_ENDPOINT, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const gatesData = data.value || data;
          
          // Update both global cache and component state
          gatesGlobalCache = gatesData;
          if (!initialLoadCompleted.current) {
            setGates(gatesData);
            setIsLoading(false);
            initialLoadCompleted.current = true;
          }
          
          return gatesData;
        })
        .catch(err => {
          console.error('[GateProvider] Error loading gate data:', err);
          setError(err as Error);
          setIsLoading(false);
          return [];
        });
      },

      byKey: function(key: string) {
        // Always check global cache first (most efficient)
        if (gatesGlobalCache) {
          console.log('[GateProvider] Looking up gate by key from global cache');
          const item = gatesGlobalCache.find(gate => compareGuids(gate.guid, key));
          return Promise.resolve(item);
        }
        
        // If we have gates in component state but not in global cache (shouldn't happen)
        if (gates.length > 0) {
          console.log('[GateProvider] Looking up gate by key from component state');
          const item = gates.find(gate => compareGuids(gate.guid, key));
          
          // Update global cache for future lookups
          if (!gatesGlobalCache) {
            gatesGlobalCache = gates;
          }
          
          return Promise.resolve(item);
        }
        
        // If no cache available, fetch just the one gate by key
        console.log('[GateProvider] Looking up gate by key from server');
        const keyFilterUrl = `${DELIVERABLE_GATES_ENDPOINT}?$filter=guid eq '${key}'`;
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
  }, [user?.token, gates, isLoading]);
  
  // Initial data loading (if needed)
  useEffect(() => {
    // If we already have global cache data, use it and skip the request
    if (gatesGlobalCache && !initialLoadCompleted.current) {
      console.log('[GateProvider] Using global cache for initial load');
      setGates(gatesGlobalCache);
      setIsLoading(false);
      initialLoadCompleted.current = true;
      return;
    }
    
    // Only load once unless forced
    if (!initialLoadCompleted.current) {
      console.log('[GateProvider] Initial gate data load');
      setIsLoading(true);
      
      // Use the data source load method to ensure cache is populated
      gatesDataSource.load({})
        .then((data: DeliverableGate[]) => {
          // Data and state updates are handled in the load method
        })
        .catch((err: Error) => {
          console.error('[GateProvider] Error in initial load:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [gatesDataSource]);
  
  /**
   * Get a deliverable gate by its ID
   * @param id The gate ID to look for
   * @returns The gate object or undefined if not found
   */
  const getGateById = useCallback((id: string): DeliverableGate | undefined => {
    // Check global cache first for best performance
    if (gatesGlobalCache) {
      return gatesGlobalCache.find(gate => compareGuids(gate.guid, id));
    }
    return gates.find(gate => compareGuids(gate.guid, id));
  }, [gates]);
  
  /**
   * Get a gate by its relative sequence number
   * @returns The gate object or undefined if not found
   */
  const getGateBySequence = useCallback((sequence: number): DeliverableGate | undefined => {
    // Check global cache first for best performance
    if (gatesGlobalCache) {
      return gatesGlobalCache.find(gate => gate.autoPercentage === sequence);
    }
    // Since sequence property doesn't exist, we're using autoPercentage as the equivalent
    return gates.find(gate => gate.autoPercentage === sequence);
  }, [gates]);
  
  return {
    gates,
    gatesStore,
    gatesDataSource,
    isLoading,
    error,
    getGateById,
    getGateBySequence
  };
};
