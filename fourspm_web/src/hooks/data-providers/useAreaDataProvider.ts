import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';
import { Area } from '../../types/odata-types';
import { compareGuids } from '../../utils/guid-utils';
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
 * Transform areas data to include backward compatibility fields
 * @param areas The areas data to transform
 * @returns Transformed areas data with additional fields
 */
const transformAreas = (areas: Area[]): AreaWithAliases[] => {
  return areas.map(area => ({
    ...area,
    areaNumber: area.number // Maintain backward compatibility
  }));
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
    select: transformAreas // Transform the data after fetching
  });
  
  // Use the transformed data from React Query
  const areas = areasData as AreaWithAliases[];
  const error = queryError as Error | null;

  /**
   * Create a custom data source for DevExtreme component compatibility
   */
  const areasDataSource = useMemo(() => {
    // Create a custom data source that works with the React Query data
    return {
      // Load method using the React Query cache
      load: () => {
        // If we don't have areas data yet and we're not loading, trigger a refetch
        if (areas.length === 0 && !isLoading && projectId) {
          refetch();
        }
        return Promise.resolve(areas);
      },
      
      // ByKey method for efficient item lookups
      byKey: (key: string) => {
        const foundItem = areas.find(a => compareGuids(a.guid, key));
        return Promise.resolve(foundItem || null);
      },
      
      // Ensure consistent field mapping
      map: (area: Area) => {
        return {
          ...area,
          areaNumber: area.number
        };
      }
    };
  }, [areas, isLoading, projectId, refetch]);

  /**
   * Get an area by its ID
   * @param id The area ID to look for
   * @returns The area object or undefined if not found
   */
  const getAreaById = useCallback((id: string): AreaWithAliases | undefined => {
    if (!id) return undefined;
    return areas.find(area => compareGuids(area.guid, id));
  }, [areas]);

  /**
   * Get an area by its number
   * @param number The area number to look for
   * @returns The area object or undefined if not found
   */
  const getAreaByNumber = useCallback((number: string): AreaWithAliases | undefined => {
    if (!number) return undefined;
    return areas.find(area => area.number === number);
  }, [areas]);

  /**
   * Get areas filtered by project ID
   * @param projectGuid The project ID to filter by
   * @returns Array of areas for the specified project
   */
  const getFilteredAreas = useCallback((projectGuid: string): AreaWithAliases[] => {
    if (!projectGuid) return [];
    
    // If the current projectId matches, return all areas (they're already filtered)
    if (projectGuid === projectId) {
      return areas;
    }
    
    // Otherwise filter the current areas array
    return areas.filter(area => compareGuids(area.projectGuid, projectGuid));
  }, [areas, projectId]);



  return {
    areas,
    areasStore,
    areasDataSource,
    isLoading,
    error,
    getAreaById,
    getAreaByNumber,
    getFilteredAreas,
    refetch
  };
};
