import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useODataStore } from '../../stores/odataStores';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { Variation } from '../../types/odata-types';
import { compareGuids } from '../../utils/guid-utils';
import ODataStore from 'devextreme/data/odata/store';
import { useAuth } from '../../contexts/auth';

// Module-level cache organized by projectId to efficiently handle project-specific variations
// This enables sharing variation data across components that need the same project's variations
interface VariationCache {
  [projectId: string]: Variation[];
}

// Shared global cache to ensure it's available across ALL component instances
// This prevents redundant API calls across different component instances
let variationsGlobalCache: VariationCache = {};

// Flag to track if we're currently loading data for a specific project
// This prevents duplicate API calls when multiple components request the same data simultaneously
const loadingFlags: { [projectId: string]: boolean } = {};

/**
 * Result interface for the variation data provider hook
 */
export interface VariationDataProviderResult {
  variations: Variation[];
  variationsStore: ODataStore;
  variationsDataSource: any; // DataSource with filtering for lookup components
  isLoading: boolean;
  error: Error | null;
  getVariationById: (id: string) => Variation | undefined;
  getFilteredVariations: (projectId: string) => Variation[];
}

/**
 * Data provider hook for variation data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * Provides caching to prevent redundant API calls within project context
 * 
 * @param projectId Optional project ID to filter variations by
 * @returns Object containing the variations store, data array, loading state, and helper methods
 */
export const useVariationDataProvider = (projectId?: string): VariationDataProviderResult => {
  // IMPORTANT: All hooks MUST be called at the top level, unconditionally
  // to satisfy React's rules of hooks
  const { user } = useAuth();
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(projectId ? true : false);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Only use the projectId as cache key if it exists, otherwise use 'all'
  const cacheKey = projectId || 'all';
  
  /**
   * Create a store for OData operations - this is used when we need direct grid operations
   * Add fieldTypes configuration to properly handle projectGuid as GUID type
   */
  const variationsStore = useODataStore(VARIATIONS_ENDPOINT, 'guid', {
    fieldTypes: {
      guid: 'Guid',
      projectGuid: 'Guid'  // This ensures proper serialization of GUID values in filters
    }
  });
  
  // Early skip for the conditional logic when projectId is not available
  // We've already called all the necessary hooks above, so this is safe
  const shouldSkipActualLoading = !projectId;

  /**
   * Create a custom store for lookups with efficient caching
   */
  const variationsDataSource = useMemo(() => {
    // Return a dummy data source if we should skip loading
    if (shouldSkipActualLoading) {
      return {
        load: () => Promise.resolve([]),
        byKey: () => Promise.resolve(null),
        map: (item: any) => item
      };
    }
    
    return {
      load: (loadOptions: any) => {
        // Always default to using the project filter if provided
        if (projectId && (!loadOptions.filter || loadOptions.filter.length === 0)) {
          loadOptions.filter = ['projectGuid', '=', projectId];
        }
        
        // Check if we have cache data for this exact query
        const checkCache = () => {
          // If we have the data in cache and we're not in a loading state, use it
          if (areCacheItemsLoaded() && !loadingFlags[cacheKey]) {
            return Promise.resolve(variationsGlobalCache[cacheKey] || []);
          }
          return null; // Signal that we need to perform an actual load
        };
        
        // Helper function to check if cache items are loaded
        const areCacheItemsLoaded = () => {
          return !!variationsGlobalCache[cacheKey] && variationsGlobalCache[cacheKey].length > 0;
        };
        
        // Try to use cache first
        const cachedResult = checkCache();
        if (cachedResult) {
          return cachedResult;
        }
        
        // Set the loading flag for this project to prevent duplicate loads
        if (!loadingFlags[cacheKey]) {
          loadingFlags[cacheKey] = true;
          
          // Perform the actual load from the server
          return variationsStore.load(loadOptions)
            .then((data: Variation[]) => {
              // Update the global cache
              variationsGlobalCache[cacheKey] = data;
              
              // Update the local state only if this component isn't unmounted
              setVariations(data);
              setIsLoading(false);
              initialLoadCompleted.current = true;
              
              // Clear the loading flag
              loadingFlags[cacheKey] = false;
              
              return data;
            })
            .catch((err: Error) => {
              console.error(`[VariationProvider] Error loading for ${cacheKey}:`, err);
              setError(err);
              setIsLoading(false);
              loadingFlags[cacheKey] = false;
              throw err;
            });
        } else {
          // Another instance is already loading, wait for it to complete
          return new Promise<Variation[]>((resolve) => {
            const checkCacheInterval = setInterval(() => {
              if (!loadingFlags[cacheKey] && variationsGlobalCache[cacheKey]) {
                clearInterval(checkCacheInterval);
                resolve(variationsGlobalCache[cacheKey] || []);
                setVariations(variationsGlobalCache[cacheKey] || []);
                setIsLoading(false);
                initialLoadCompleted.current = true;
              }
            }, 100);
          });
        }
      },
      
      byKey: (key: string) => {
        if (shouldSkipActualLoading) {
          return Promise.resolve(null);
        }
        
        // Check if we have this specific variation in the cache by guid
        if (variationsGlobalCache[cacheKey]) {
          const cachedVariation = variationsGlobalCache[cacheKey].find(
            (variation) => compareGuids(variation.guid, key)
          );
          
          if (cachedVariation) {
            return Promise.resolve(cachedVariation);
          }
        }
        
        // If not in cache, load from the server
        return variationsStore.byKey(key);
      },
      
      // Ensure consistent field mapping
      map: (variation: Variation) => {
        return variation;
      }
    };
  }, [variationsStore, projectId, cacheKey, shouldSkipActualLoading]);
  
  /**
   * Initial data loading (if needed)
   */
  useEffect(() => {
    // Skip loading entirely if we have no projectGuid
    if (shouldSkipActualLoading) {
      if (!initialLoadCompleted.current) {
        // Skipping variation data load - no projectGuid provided
        initialLoadCompleted.current = true;
      }
      return;
    }
    
    // If we already have cache data for this project, use it and skip the request
    if (variationsGlobalCache[cacheKey] && !initialLoadCompleted.current) {
      // Using global cache for initial load
      setVariations(variationsGlobalCache[cacheKey]);
      setIsLoading(false);
      initialLoadCompleted.current = true;
      return;
    }
    
    // Only load once per project unless forced
    if (!initialLoadCompleted.current) {
      // Initial variation data load
      
      // Use the data source load method to ensure cache is populated
      variationsDataSource.load({ filter: projectId ? ['projectGuid', '=', projectId] : null })
        .then((data: unknown) => {
          // Data and state updates are handled in the load method
          // Type assertion isn't needed here as we don't use the data directly
        })
        .catch((err: Error) => {
          console.error(`[VariationProvider] Error in initial load for ${cacheKey}:`, err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [variationsDataSource, projectId, cacheKey, shouldSkipActualLoading]); // Run on initial mount or when projectId changes
  
  /**
   * Get a variation by its ID
   * @param id The variation ID to look for
   * @returns The variation object or undefined if not found
   */
  const getVariationById = useCallback((id: string): Variation | undefined => {
    // Return undefined immediately if we're in skip mode
    if (shouldSkipActualLoading) return undefined;
    
    // Check global cache first for best performance
    if (variationsGlobalCache[cacheKey]) {
      return variationsGlobalCache[cacheKey].find(variation => compareGuids(variation.guid, id));
    }
    return variations.find(variation => compareGuids(variation.guid, id));
  }, [variations, cacheKey, shouldSkipActualLoading]);

  /**
   * Get variations filtered by project ID
   * @param projectGuid The project ID to filter by
   * @returns Array of variations for the specified project
   */
  const getFilteredVariations = useCallback((projectGuid: string): Variation[] => {
    // Return empty array immediately if we're in skip mode
    if (shouldSkipActualLoading) return [];
    
    // Check if we have a cache for this specific project
    if (variationsGlobalCache[projectGuid]) {
      return variationsGlobalCache[projectGuid];
    }
    
    // If the current cache key is for this project, use the current variations
    if (projectGuid === projectId) {
      return variations;
    }
    
    // Otherwise filter from the general cache if available
    if (variationsGlobalCache['all']) {
      return variationsGlobalCache['all'].filter(variation => compareGuids(variation.projectGuid, projectGuid));
    }
    
    // Finally, fall back to filtering the current variations array
    return variations.filter(variation => compareGuids(variation.projectGuid, projectGuid));
  }, [variations, projectId, shouldSkipActualLoading]);

  return {
    variations,
    variationsStore,
    variationsDataSource,
    isLoading,
    error,
    getVariationById,
    getFilteredVariations
  };
};
