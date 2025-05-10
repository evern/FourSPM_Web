import { useQuery } from '@tanstack/react-query';
import { Variation } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { baseApiService } from '../../api/base-api.service';

/**
 * Fetch variations data from the API
 * @param projectId Optional project ID to filter variations by
 * @returns Promise with array of variations
 */
const fetchVariations = async (projectId?: string): Promise<Variation[]> => {
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : '';
  const url = `${VARIATIONS_ENDPOINT}?${filter}`;
  
  const response = await baseApiService.request(url);
  const data = await response.json();
  
  return data.value || [];
};

/**
 * Result interface for the variation data provider hook
 */
export interface VariationDataProviderResult {
  variations: Variation[];
  variationsStore: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Data provider hook for variation data
 * Uses React Query for efficient data fetching and caching
 * 
 * @param projectId Optional project ID to filter variations by
 * @returns Object containing the variations store, data array, loading state, and helper methods
 */
export const useVariationDataProvider = (projectId?: string): VariationDataProviderResult => {
  // Create a store for OData operations with proper field types
  const variationsStore = useODataStore(VARIATIONS_ENDPOINT, 'guid', {
    fieldTypes: {
      guid: 'Guid',
      projectGuid: 'Guid'  // This ensures proper serialization of GUID values in filters
    }
  });

  // Use React Query to fetch and cache variations
  const { 
    data: variations = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['variations', projectId],
    queryFn: () => fetchVariations(projectId),
    enabled: !!projectId // Only run query if projectId is provided
  });
  
  const error = queryError as Error | null;

  return {
    variations,
    variationsStore,
    isLoading,
    error,
    refetch
  };
};