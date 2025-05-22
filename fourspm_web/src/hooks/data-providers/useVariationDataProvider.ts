import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { Variation } from '../../types/odata-types';
import { baseApiService } from '../../api/base-api.service';
import { useToken } from '../../contexts/token-context';

/**
 * Fetch variations data from the API
 * @param token Authentication token
 * @param projectId Optional project ID to filter variations by
 * @returns Promise with array of variations
 */
const fetchVariations = async (token?: string, projectId?: string): Promise<Variation[]> => {
  // Ensure we have a valid API request configuration
  const requestOptions = {
    method: 'GET'
  } as any;
  
  // Add token if available
  if (token) {
    requestOptions.token = token;
  } else {
    console.warn('fetchVariations: No token provided, request may fail');
  }
  
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : '';
  const url = `${VARIATIONS_ENDPOINT}?${filter}`;
  
  const response = await baseApiService.request(url, requestOptions);
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
  // Get token from TokenContext
  const { token } = useToken();
  
  // Create a store for OData operations with proper field types and token
  const variationsStore = useODataStore(VARIATIONS_ENDPOINT, 'guid', {
    fieldTypes: {
      guid: 'Guid',
      projectGuid: 'Guid'  // This ensures proper serialization of GUID values in filters
    },
    token // Pass token to ODataStore
  });

  // Use React Query to fetch and cache variations
  const { 
    data: variations = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['variations', projectId, token], // Include token in query key to refetch when token changes
    queryFn: () => fetchVariations(token || undefined, projectId), // Pass token to fetch function
    enabled: !!token && !!projectId // Only run query if both token and projectId are provided
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