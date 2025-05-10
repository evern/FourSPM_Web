import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';
import { Area } from '../../types/odata-types';
import ODataStore from 'devextreme/data/odata/store';
import { baseApiService } from '../../api/base-api.service';

// This helps us normalize field names between Area and Deliverable entities
type AreaWithAliases = Area & {
  areaNumber?: string; // Add this alias for Deliverable compatibility
};

/**
 * Fetch areas data from the API
 * @param projectId Optional project ID to filter areas by
 * @returns Promise with array of areas
 */
const fetchAreas = async (projectId?: string): Promise<Area[]> => {
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : '';
  const url = `${AREAS_ENDPOINT}?${filter}`;
  
  const response = await baseApiService.request(url);
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
  // Create a store for OData operations - this is used when we need direct grid operations
  const areasStore = useODataStore(AREAS_ENDPOINT, 'guid', {
    fieldTypes: {
      number: 'string', // The primary key is also a GUID and needs proper handling
      projectGuid: 'Guid'  // This ensures proper serialization of GUID values in filters
    }
  });
  
  // Use React Query to fetch and cache areas
  const { 
    data: areasData = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['areas', projectId],
    queryFn: () => fetchAreas(projectId),
    enabled: !!projectId, // Only fetch if we have a projectId
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
