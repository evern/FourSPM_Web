import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';
import { Area } from '../../types/odata-types';
import ODataStore from 'devextreme/data/odata/store';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';

// This helps us normalize field names between Area and Deliverable entities
type AreaWithAliases = Area & {
  areaNumber?: string; // Add this alias for Deliverable compatibility
};

/**
 * Fetch areas data from the API
 * @param token Optional token - can be string, null, or undefined
 * @param projectId Optional project ID to filter areas by
 * @returns Promise with array of areas
 */
const fetchAreas = async (token?: string | null, projectId?: string): Promise<Area[]> => {
  // Ensure we have a valid API request configuration
  const requestOptions = {
    method: 'GET'
  } as any;
  
  // Add token if available
  if (token) {
    requestOptions.token = token;
  } else {
    console.warn('fetchAreas: No token provided, request may fail');
  }
  
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : '';
  const url = `${AREAS_ENDPOINT}?${filter}`;
  
  const response = await baseApiService.request(url, requestOptions);
  const data = await response.json();
  
  return data.value || [];
};

/**
 * Result interface for the area data provider hook
 */
export interface AreaDataProviderResult {
  areas: AreaWithAliases[];
  areasStore: ODataStore;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Data provider hook for area data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * Uses React Query for efficient data fetching and caching
 * 
 * @param projectId Optional project ID to filter areas by
 * @returns Object containing the areas store, data array, loading state, and helper methods
 */
export const useAreaDataProvider = (projectId?: string): AreaDataProviderResult => {
  // Using Optimized Direct Access Pattern - token retrieved at leaf methods
  
  // Create a store for OData operations - this is used when we need direct grid operations
  const areasStore = useODataStore(AREAS_ENDPOINT, 'guid', {
    fieldTypes: {
      number: 'string', // The primary key is also a GUID and needs proper handling
      projectGuid: 'Guid'  // This ensures proper serialization of GUID values in filters
    }
    // No token needed here as the store will get it directly when needed
  });
  
  // Use React Query to fetch and cache areas - token access is optimized
  const { 
    data: areasData = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['areas', projectId], // No token dependency in query key - using Optimized Direct Access Pattern
    queryFn: () => fetchAreas(getToken(), projectId), // Get token directly at the point of use
    enabled: !!projectId, // Only fetch if we have projectId - token check is done inside fetchAreas
    select: (data: Area[]) => data,
    refetchOnWindowFocus: true, // Refetch data when the window regains focus
    staleTime: 5 * 60 * 1000 // Consider data stale after 5 minutes
  });
  
  // Use the transformed data from React Query
  const areas = areasData as AreaWithAliases[];
  const error = queryError as Error | null;





  return {
    areas,
    areasStore,
    isLoading,
    error,
    refetch
  };
};
