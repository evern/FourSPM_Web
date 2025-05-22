import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { DISCIPLINES_ENDPOINT } from '../../config/api-endpoints';
import { Discipline } from '../../types/odata-types';
import ODataStore from 'devextreme/data/odata/store';
import { baseApiService } from '../../api/base-api.service';
import { useToken } from '../../contexts/token-context';

/**
 * Fetch disciplines data from the API
 * @param token Authentication token
 * @returns Promise with array of disciplines
 */
const fetchDisciplines = async (token: string | null): Promise<Discipline[]> => {
  if (!token) {
    console.error('fetchDisciplines: No token provided');
    throw new Error('Authentication token is required');
  }
  
  const response = await baseApiService.request(DISCIPLINES_ENDPOINT, {
    token // Pass token explicitly to API service
  });
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
  // Get token from TokenContext
  const { token } = useToken();
  
  // Create a global store for direct OData operations with token
  const disciplinesStore = useODataStore(DISCIPLINES_ENDPOINT, 'guid', {
    token // Pass token to ODataStore
  });

  // Use React Query to fetch and cache disciplines
  const { 
    data: disciplines = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['disciplines', token], // Include token in query key to refetch when token changes
    queryFn: () => fetchDisciplines(token), // Pass token to fetch function
    enabled: !!token && shouldLoad // Only fetch if token is available and shouldLoad is true
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
