import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useODataStore } from '../../stores/odataStores';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { Variation } from '../../types/odata-types';
import { compareGuids } from '../../utils/guid-utils';
import ODataStore from 'devextreme/data/odata/store';

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
 * 
 * @param projectId Optional project ID to filter variations by
 * @returns Object containing the variations store, data array, loading state, and helper methods
 */
export const useVariationDataProvider = (projectId?: string): VariationDataProviderResult => {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Use the hook to get the store
  const variationsStore = useODataStore(VARIATIONS_ENDPOINT);
  
  // Create a DataSource with filter for lookups
  const variationsDataSource = useMemo(() => {
    return {
      store: variationsStore,
      filter: projectId ? `projectGuid eq ${projectId}` : undefined
    };
  }, [variationsStore, projectId]);
  
  // Load data from store on component mount or when projectId changes
  useEffect(() => {
    // Reset the initial load flag when projectId changes
    if (projectId) {
      initialLoadCompleted.current = false;
    }
    
    // Only load once unless the store reference or projectId actually changes
    if (!initialLoadCompleted.current) {
      setIsLoading(true);
      
      const loadOptions: any = {};
      
      // Add filter if we have a projectId
      if (projectId) {
        loadOptions.filter = `projectGuid eq ${projectId}`;
      }
      
      variationsStore.load(loadOptions)
        .then((data: Variation[]) => {
          setVariations(data);
          setIsLoading(false);
          initialLoadCompleted.current = true;
        })
        .catch((err: Error) => {
          console.error('Error loading variations:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [variationsStore, projectId]); 
  
  /**
   * Get a variation by its ID
   * @param id The variation ID to look for
   * @returns The variation object or undefined if not found
   */
  const getVariationById = useCallback((id: string): Variation | undefined => {
    return variations.find(variation => compareGuids(variation.guid, id));
  }, [variations]);

  /**
   * Get variations filtered by project ID
   * @param projectId The project ID to filter by
   * @returns Array of variations for the specified project
   */
  const getFilteredVariations = useCallback((projectGuid: string): Variation[] => {
    return variations.filter(variation => compareGuids(variation.projectGuid, projectGuid));
  }, [variations]);

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
