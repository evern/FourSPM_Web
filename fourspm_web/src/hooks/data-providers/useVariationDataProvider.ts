import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { Variation } from '../../types/odata-types';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';

/**
 * Fetch variations data from the API
 * @param token Optional token - can be string, null, or undefined
 * @param projectId Optional project ID to filter variations by
 * @returns Promise with array of variations
 */
const fetchVariations = async (token?: string | null, projectId?: string): Promise<Variation[]> => {
  // Using Optimized Direct Access Pattern - get token directly if not provided
  const authToken = token || getToken();
  
  // Validate token at the point of use
  if (!authToken) {
    console.error('fetchVariations: No token available');
    throw new Error('Authentication token is required');
  }
  
  // Ensure we have a valid API request configuration
  const requestOptions = {
    method: 'GET',
    token: authToken
  } as any;
  
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
  // Using Optimized Direct Access Pattern - token retrieved at leaf methods
  
  // Create a store for OData operations with proper field types
  const variationsStore = useODataStore(VARIATIONS_ENDPOINT, 'guid', {
    fieldTypes: {
      guid: 'Guid',
      projectGuid: 'Guid'  // This ensures proper serialization of GUID values in filters
    }
    // No token needed here, the store will get it directly when needed
  });

  // Use React Query to fetch and cache variations - optimized token access
  const { 
    data: variations = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['variations', projectId], // No token dependency - using Optimized Direct Access Pattern
    queryFn: () => fetchVariations(getToken(), projectId), // Get token directly at the point of use
    enabled: !!projectId // Only need to check projectId - token check is done in fetchVariations
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