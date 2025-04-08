import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Discipline } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { DISCIPLINES_ENDPOINT } from '../../config/api-endpoints';
import { useAuth } from '../../contexts/auth';

// Module-level cache to ensure it's shared across ALL instances
// This is key to preventing multiple requests
let disciplinesGlobalCache: Discipline[] | null = null;

/**
 * Interface for discipline data provider result
 */
export interface DisciplineDataProviderResult {
  disciplines: Discipline[];
  disciplinesStore: ODataStore;
  disciplinesDataSource: any; // DataSource for lookup components
  isLoading: boolean;
  error: Error | null;
  getDisciplineById: (id: string) => Discipline | undefined;
  getDisciplineByCode: (code: string) => Discipline | undefined;
}

/**
 * Data provider hook for discipline data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the disciplines store, data array, loading state, and helper methods
 */
export const useDisciplineDataProvider = (): DisciplineDataProviderResult => {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Use the hook to get the store
  const disciplinesStore = useODataStore(DISCIPLINES_ENDPOINT);
  
  // Create a DataSource with caching for lookups
  const disciplinesDataSource = useMemo(() => {
    // Create the lookup data source with optimized load/byKey methods
    return {
      load: function(loadOptions: any) {
        // If global cache already has data, use it immediately
        if (disciplinesGlobalCache) {
          console.log('[DisciplineProvider] Using global cache for load - no server request');
          return Promise.resolve(disciplinesGlobalCache);
        }
        
        // If we already loaded data into component state, update global cache and return
        if (disciplines.length > 0 && !isLoading) {
          console.log('[DisciplineProvider] Using component state for load - no server request');
          disciplinesGlobalCache = disciplines;
          return Promise.resolve(disciplines);
        }
        
        // Otherwise make a direct fetch to avoid ODataStore overhead
        console.log('[DisciplineProvider] No cache available - fetching from server');
        return fetch(DISCIPLINES_ENDPOINT, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const disciplinesData = data.value || data;
          
          // Update both global cache and component state
          disciplinesGlobalCache = disciplinesData;
          if (!initialLoadCompleted.current) {
            setDisciplines(disciplinesData);
            setIsLoading(false);
            initialLoadCompleted.current = true;
          }
          
          return disciplinesData;
        })
        .catch(err => {
          console.error('[DisciplineProvider] Error loading discipline data:', err);
          setError(err as Error);
          setIsLoading(false);
          return [];
        });
      },

      byKey: function(key: string) {
        // Always check global cache first (most efficient)
        if (disciplinesGlobalCache) {
          console.log('[DisciplineProvider] Looking up discipline by key from global cache');
          const item = disciplinesGlobalCache.find(discipline => compareGuids(discipline.guid, key));
          return Promise.resolve(item);
        }
        
        // If we have disciplines in component state but not in global cache (shouldn't happen)
        if (disciplines.length > 0) {
          console.log('[DisciplineProvider] Looking up discipline by key from component state');
          const item = disciplines.find(discipline => compareGuids(discipline.guid, key));
          
          // Update global cache for future lookups
          if (!disciplinesGlobalCache) {
            disciplinesGlobalCache = disciplines;
          }
          
          return Promise.resolve(item);
        }
        
        // If no cache available, fetch just the one discipline by key
        console.log('[DisciplineProvider] Looking up discipline by key from server');
        const keyFilterUrl = `${DISCIPLINES_ENDPOINT}?$filter=guid eq '${key}'`;
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
  }, [user?.token, disciplines, isLoading]);
  
  // Initial data loading (if needed)
  useEffect(() => {
    // If we already have global cache data, use it and skip the request
    if (disciplinesGlobalCache && !initialLoadCompleted.current) {
      console.log('[DisciplineProvider] Using global cache for initial load');
      setDisciplines(disciplinesGlobalCache);
      setIsLoading(false);
      initialLoadCompleted.current = true;
      return;
    }
    
    // Only load once unless forced
    if (!initialLoadCompleted.current) {
      console.log('[DisciplineProvider] Initial discipline data load');
      setIsLoading(true);
      
      // Use the data source load method to ensure cache is populated
      disciplinesDataSource.load({})
        .then((data: Discipline[]) => {
          // Data and state updates are handled in the load method
        })
        .catch((err: Error) => {
          console.error('[DisciplineProvider] Error in initial load:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [disciplinesDataSource]); // Only run on initial mount or when datasource changes
  
  /**
   * Get a discipline by its ID
   * @param id The discipline ID to look for
   * @returns The discipline object or undefined if not found
   */
  const getDisciplineById = useCallback((id: string): Discipline | undefined => {
    // Check global cache first for best performance
    if (disciplinesGlobalCache) {
      return disciplinesGlobalCache.find(discipline => compareGuids(discipline.guid, id));
    }
    return disciplines.find(discipline => compareGuids(discipline.guid, id));
  }, [disciplines]);
  
  /**
   * Get a discipline by its code
   * @param code The discipline code to look for
   * @returns The discipline object or undefined if not found
   */
  const getDisciplineByCode = useCallback((code: string): Discipline | undefined => {
    // Check global cache first for best performance
    if (disciplinesGlobalCache) {
      return disciplinesGlobalCache.find(discipline => discipline.code === code);
    }
    return disciplines.find(discipline => discipline.code === code);
  }, [disciplines]);
  
  return {
    disciplines,
    disciplinesStore,
    disciplinesDataSource,
    isLoading,
    error,
    getDisciplineById,
    getDisciplineByCode
  };
};
