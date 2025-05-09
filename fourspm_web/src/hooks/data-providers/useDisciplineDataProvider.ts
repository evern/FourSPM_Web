import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DISCIPLINES_ENDPOINT } from '../../config/api-endpoints';
import { useODataStore } from '../../stores/odataStores';
import { Discipline } from '../../types/odata-types';
import { compareGuids } from '../../utils/guid-utils';
import { baseApiService } from '../../api/base-api.service';

/**
 * Fetch disciplines data from the API
 * @returns Promise with array of disciplines
 */
const fetchDisciplines = async (): Promise<Discipline[]> => {
  const response = await baseApiService.request(DISCIPLINES_ENDPOINT);
  const data = await response.json();
  return data.value || [];
};

/**
 * Result interface for the discipline data provider hook
 */
export interface DisciplineDataProviderResult {
  disciplines: Discipline[];
  disciplinesStore: any;
  disciplinesDataSource: any;
  isLoading: boolean;
  error: Error | null;
  getDisciplineById: (id: string) => Discipline | undefined;
  getDisciplineByCode: (code: string) => Discipline | undefined;
  refetch: () => Promise<any>;
}

/**
 * Data provider hook for discipline data
 * @returns Object containing the disciplines store, data array, and loading state
 */
export const useDisciplineDataProvider = (shouldLoad: boolean | undefined = true): DisciplineDataProviderResult => {
  // Create a global store for direct OData operations
  const disciplinesStore = useODataStore(DISCIPLINES_ENDPOINT, 'guid');

  // Use React Query to fetch and cache disciplines
  const { 
    data: disciplines = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['disciplines'],
    queryFn: fetchDisciplines
  });
  
  const error = queryError as Error | null;

  /**
   * Custom data source for DevExtreme compatibility
   */
  const disciplinesDataSource = useMemo(() => ({
    load: () => {
      if (disciplines.length === 0 && !isLoading) {
        refetch();
      }
      return Promise.resolve(disciplines);
    },
    byKey: (key: string) => {
      const foundItem = disciplines.find(discipline => compareGuids(discipline.guid, key));
      return Promise.resolve(foundItem || null);
    }
  }), [disciplines, isLoading, refetch]);

  /**
   * Get a discipline by ID
   */
  const getDisciplineById = useCallback((id: string): Discipline | undefined => {
    if (!id) return undefined;
    return disciplines.find(discipline => compareGuids(discipline.guid, id));
  }, [disciplines]);

  /**
   * Get a discipline by code
   * @param code The discipline code to look for
   * @returns The discipline object or undefined if not found
   */
  const getDisciplineByCode = useCallback((code: string): Discipline | undefined => {
    return disciplines.find(discipline => discipline.code === code);
  }, [disciplines]);

  return {
    disciplines,
    disciplinesStore,
    disciplinesDataSource,
    isLoading,
    error,
    getDisciplineById,
    getDisciplineByCode,
    refetch
  };
};
