import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useODataStore } from '../../stores/odataStores';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';
import { Area } from '../../types/odata-types';
import { compareGuids } from '../../utils/guid-utils';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/**
 * Result interface for the area data provider hook
 */
export interface AreaDataProviderResult {
  areas: Area[];
  areasStore: ODataStore;
  areasDataSource: any; // DataSource with filtering for lookup components
  isLoading: boolean;
  error: Error | null;
  getAreaById: (id: string) => Area | undefined;
  getAreaByNumber: (number: string) => Area | undefined;
  getFilteredAreas: (projectId: string) => Area[];
}

/**
 * Data provider hook for area data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @param projectId Optional project ID to filter areas by
 * @returns Object containing the areas store, data array, loading state, and helper methods
 */
export const useAreaDataProvider = (projectId?: string): AreaDataProviderResult => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Use the hook to get the store
  const areasStore = useODataStore(AREAS_ENDPOINT);
  
  // Create a DataSource with filter for lookups (similar to previous createAreaStore)
  const areasDataSource = useMemo(() => {
    return {
      store: areasStore,
      filter: projectId ? `projectGuid eq ${projectId}` : undefined
    };
  }, [areasStore, projectId]);
  
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
      
      areasStore.load(loadOptions)
        .then((data: Area[]) => {
          setAreas(data);
          setIsLoading(false);
          initialLoadCompleted.current = true;
        })
        .catch((err: Error) => {
          console.error('Error loading areas:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [areasStore, projectId]); 
  
  /**
   * Get an area by its ID
   * @param id The area ID to look for
   * @returns The area object or undefined if not found
   */
  const getAreaById = useCallback((id: string): Area | undefined => {
    return areas.find(area => compareGuids(area.guid, id));
  }, [areas]);

  /**
   * Get an area by its number
   * @param number The area number to look for
   * @returns The area object or undefined if not found
   */
  const getAreaByNumber = useCallback((number: string): Area | undefined => {
    return areas.find(area => area.number === number);
  }, [areas]);

  /**
   * Get areas filtered by project ID
   * @param projectId The project ID to filter by
   * @returns Array of areas for the specified project
   */
  const getFilteredAreas = useCallback((projectGuid: string): Area[] => {
    return areas.filter(area => compareGuids(area.projectGuid, projectGuid));
  }, [areas]);

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
