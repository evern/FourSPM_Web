import { useQuery } from '@tanstack/react-query';
import { DISCIPLINES_ENDPOINT } from '../../config/api-endpoints';
import { useODataStore } from '../../stores/odataStores';
import { Discipline } from '../../types/odata-types';
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
  isLoading: boolean;
  error: Error | null;
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

  return {
    disciplines,
    disciplinesStore,
    isLoading,
    error,
    refetch
  };
};
