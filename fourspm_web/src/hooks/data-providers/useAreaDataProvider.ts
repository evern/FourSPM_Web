import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useODataStore } from '../../stores/odataStores';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';
import { Area } from '../../types/odata-types';
import { compareGuids } from '../../utils/guid-utils';
import ODataStore from 'devextreme/data/odata/store';
import { useAuth } from '../../contexts/auth';

// Module-level cache organized by projectId to efficiently handle project-specific areas
// This enables sharing area data across components that need the same project's areas
interface AreaCache {
  [projectId: string]: AreaWithAliases[];
}

// Shared global cache to ensure it's available across ALL component instances
// This prevents redundant API calls across different component instances
let areasGlobalCache: AreaCache = {};

// Flag to track if we're currently loading data for a specific project
// This prevents duplicate API calls when multiple components request the same data simultaneously
const loadingFlags: { [projectId: string]: boolean } = {};

// This helps us normalize field names between Area and Deliverable entities
type AreaWithAliases = Area & {
  areaNumber?: string; // Add this alias for Deliverable compatibility
};

/**
 * Result interface for the area data provider hook
 */
export interface AreaDataProviderResult {
  areas: AreaWithAliases[];
  areasStore: ODataStore;
  areasDataSource: any; // DataSource with filtering for lookup components
  isLoading: boolean;
  error: Error | null;
  getAreaById: (id: string) => AreaWithAliases | undefined;
  getAreaByNumber: (number: string) => AreaWithAliases | undefined;
  getFilteredAreas: (projectId: string) => AreaWithAliases[];
}

/**
 * Data provider hook for area data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * Provides caching to prevent redundant API calls within project context
 * 
 * @param projectId Optional project ID to filter areas by
 * @returns Object containing the areas store, data array, loading state, and helper methods
 */
export const useAreaDataProvider = (projectId?: string): AreaDataProviderResult => {
  // IMPORTANT: All hooks MUST be called at the top level, unconditionally
  // to satisfy React's rules of hooks
  const { user } = useAuth();
  const [areas, setAreas] = useState<AreaWithAliases[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(projectId ? true : false);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Only use the projectId as cache key if it exists, otherwise use 'all'
  const cacheKey = projectId || 'all';
  
  /**
   * Create a store for OData operations - this is used when we need direct grid operations
   * Add fieldTypes configuration to properly handle projectGuid as GUID type
   */
  const areasStore = useODataStore(AREAS_ENDPOINT, 'guid', {
    fieldTypes: {
      number: 'string', // The primary key is also a GUID and needs proper handling
      projectGuid: 'Guid'  // This ensures proper serialization of GUID values in filters
    }
  });
  
  // Early skip for the conditional logic when projectId is not available
  // We've already called all the necessary hooks above, so this is safe
  const shouldSkipActualLoading = !projectId;

  /**
   * Preprocess areas to add areaNumber alias
   */
  const preprocessAreas = (data: Area[]): AreaWithAliases[] => {
    return data.map(area => ({
      ...area,
      // Add the areaNumber alias to match what the Deliverable entity expects
      areaNumber: area.number
    }));
  };

  /**
   * Create a custom store for lookups with efficient caching
   * Similar pattern to useClientDataProvider but with project-specific filtering
   */
  const areasDataSource = useMemo(() => {
    // Return a dummy data source if we should skip loading
    if (shouldSkipActualLoading) {
      return {
        load: () => Promise.resolve([]),
        byKey: () => Promise.resolve(null),
        map: (item: any) => item
      };
    }
    
    return {
      load: function(loadOptions: any) {
        // Apply project filter if provided in the hook options
        if (projectId && !loadOptions.filter) {
          loadOptions.filter = ['projectGuid', '=', projectId];
        }

        // Extract the projectId from the filter if present
        let targetProjectId = projectId || 'all';
        if (loadOptions.filter && Array.isArray(loadOptions.filter) && loadOptions.filter[1] === '=') {
          // Handle case where filter is ['projectGuid', '=', someProjectId]
          if (loadOptions.filter[0] === 'projectGuid') {
            targetProjectId = loadOptions.filter[2];
          }
        }
        
        // If we have cached data for this project, use it immediately
        if (areasGlobalCache[targetProjectId]) {
          console.log(`[AreaProvider] Using cache for project ${targetProjectId} - avoiding server request`);
          return Promise.resolve(areasGlobalCache[targetProjectId]);
        }
        
        // If we already loaded into component state and it matches our target, use that
        if (areas.length > 0 && !isLoading && targetProjectId === cacheKey) {
          console.log(`[AreaProvider] Using component state for project ${targetProjectId}`);
          if (!areasGlobalCache[targetProjectId]) {
            areasGlobalCache[targetProjectId] = areas;
          }
          return Promise.resolve(areas);
        }
        
        // If we're already loading this project in another instance, wait for it
        if (loadingFlags[targetProjectId]) {
          console.log(`[AreaProvider] Already loading ${targetProjectId} - waiting for completion`);
          // Poll the cache every 100ms for up to 5 seconds
          return new Promise((resolve, reject) => {
            let attempts = 0;
            const checkCache = () => {
              if (areasGlobalCache[targetProjectId]) {
                resolve(areasGlobalCache[targetProjectId]);
              } else if (++attempts > 50) { // 5 seconds (50 * 100ms)
                reject(new Error('Timeout waiting for areas data'));
              } else {
                setTimeout(checkCache, 100);
              }
            };
            checkCache();
          });
        }
        
        // Otherwise fetch from the server
        console.log(`[AreaProvider] No cache for ${targetProjectId} - fetching from server`);
        loadingFlags[targetProjectId] = true;
        
        // Construct appropriate filter for API call
        let apiUrl = AREAS_ENDPOINT;
        if (targetProjectId !== 'all') {
          // Proper OData v4 filter format for GUIDs with single quotes
          apiUrl += `?$filter=projectGuid eq ${targetProjectId}`;
        }
        
        return fetch(apiUrl, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const areasData = data.value || data;
          const processedAreas = preprocessAreas(areasData);
          
          // Update global cache and release loading flag
          areasGlobalCache[targetProjectId] = processedAreas;
          loadingFlags[targetProjectId] = false;
          
          // If this is for the current component's project, update state too
          if (targetProjectId === cacheKey && !initialLoadCompleted.current) {
            setAreas(processedAreas);
            setIsLoading(false);
            initialLoadCompleted.current = true;
          }
          
          return processedAreas;
        })
        .catch(err => {
          console.error(`[AreaProvider] Error loading areas for ${targetProjectId}:`, err);
          loadingFlags[targetProjectId] = false;
          setError(err);
          setIsLoading(false);
          return [];
        });
      },

      byKey: function(key: string) {
        // Try to find in any cache first
        for (const projectId in areasGlobalCache) {
          // Look up by number instead of guid to match our API filter
          const item = areasGlobalCache[projectId].find(area => area.number === key);
          if (item) {
            console.log(`[AreaProvider] Found area number ${key} in cache for project ${projectId}`);
            return Promise.resolve(item);
          }
        }
        
        // If not in cache, fetch just this one area
        console.log(`[AreaProvider] Area number ${key} not in cache - fetching from server`);
        // Use number field for filtering consistent with cache lookup
        const keyFilterUrl = `${AREAS_ENDPOINT}?$filter=number eq '${key}'`;
        
        return fetch(keyFilterUrl, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const items = data.value || data;
          if (items.length > 0) {
            const processedItem = preprocessAreas([items[0]])[0];
            return processedItem;
          }
          return null;
        });
      },

      // Ensure consistent field mapping
      map: (area: Area) => {
        return {
          ...area,
          areaNumber: area.number
        };
      }
    };
  }, [user?.token, areas, isLoading, projectId, cacheKey]);

  /**
   * Initial data loading (if needed)
   */
  useEffect(() => {
    // Skip loading entirely if we have no projectGuid
    if (shouldSkipActualLoading) {
      if (!initialLoadCompleted.current) {
        console.log('[AreaProvider] Skipping area data load - no projectGuid provided');
        initialLoadCompleted.current = true;
      }
      return;
    }
    
    // If we already have cache data for this project, use it and skip the request
    if (areasGlobalCache[cacheKey] && !initialLoadCompleted.current) {
      console.log(`[AreaProvider] Using global cache for initial load of ${cacheKey}`);
      setAreas(areasGlobalCache[cacheKey]);
      setIsLoading(false);
      initialLoadCompleted.current = true;
      return;
    }
    
    // Only load once per project unless forced
    if (!initialLoadCompleted.current) {
      console.log(`[AreaProvider] Initial area data load for ${cacheKey}`);
      
      // Use the data source load method to ensure cache is populated
      areasDataSource.load({ filter: projectId ? ['projectGuid', '=', projectId] : null })
        .then((data: unknown) => {
          // Data and state updates are handled in the load method
          // Type assertion isn't needed here as we don't use the data directly
        })
        .catch((err: Error) => {
          console.error(`[AreaProvider] Error in initial load for ${cacheKey}:`, err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [areasDataSource, projectId, cacheKey, shouldSkipActualLoading]); // Run on initial mount or when projectId changes
  
  /**
   * Get an area by its ID
   * @param id The area ID to look for
   * @returns The area object or undefined if not found
   */
  const getAreaById = useCallback((id: string): AreaWithAliases | undefined => {
    // Return undefined immediately if we're in skip mode
    if (shouldSkipActualLoading) return undefined;
    
    // Check global cache first for best performance
    if (areasGlobalCache[cacheKey]) {
      return areasGlobalCache[cacheKey].find(area => compareGuids(area.guid, id));
    }
    return areas.find(area => compareGuids(area.guid, id));
  }, [areas, cacheKey, shouldSkipActualLoading]);

  /**
   * Get an area by its number
   * @param number The area number to look for
   * @returns The area object or undefined if not found
   */
  const getAreaByNumber = useCallback((number: string): AreaWithAliases | undefined => {
    // Return undefined immediately if we're in skip mode
    if (shouldSkipActualLoading) return undefined;
    
    // Check global cache first for best performance
    if (areasGlobalCache[cacheKey]) {
      return areasGlobalCache[cacheKey].find(area => area.number === number);
    }
    return areas.find(area => area.number === number);
  }, [areas, cacheKey, shouldSkipActualLoading]);

  /**
   * Get areas filtered by project ID
   * @param projectGuid The project ID to filter by
   * @returns Array of areas for the specified project
   */
  const getFilteredAreas = useCallback((projectGuid: string): AreaWithAliases[] => {
    // Return empty array immediately if we're in skip mode
    if (shouldSkipActualLoading) return [];
    
    // Check if we have a cache for this specific project
    if (areasGlobalCache[projectGuid]) {
      return areasGlobalCache[projectGuid];
    }
    
    // If the current cache key is for this project, use the current areas
    if (projectGuid === projectId) {
      return areas;
    }
    
    // Otherwise filter from the general cache if available
    if (areasGlobalCache['all']) {
      return areasGlobalCache['all'].filter(area => compareGuids(area.projectGuid, projectGuid));
    }
    
    // Finally, fall back to filtering the current areas array
    return areas.filter(area => compareGuids(area.projectGuid, projectGuid));
  }, [areas, projectId, shouldSkipActualLoading]);

  return {
    areas,
    areasStore,
    areasDataSource,
    isLoading,
    error,
    getAreaById,
    getAreaByNumber,
    getFilteredAreas
  };
};
