import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { DISCIPLINES_ENDPOINT } from '../../config/api-endpoints';
import { Discipline } from '../../types/odata-types';
import ODataStore from 'devextreme/data/odata/store';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';

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
  // Using Optimized Direct Access Pattern - token retrieved at leaf methods
  
  // Create a global store for direct OData operations - token access is direct
  const disciplinesStore = useODataStore(DISCIPLINES_ENDPOINT, 'guid', {
    // No token needed here as the store will get it directly when needed
  });

  // Use React Query to fetch and cache disciplines - token access is optimized
  const { 
    data: disciplines = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['disciplines'], // No token dependency in query key - using Optimized Direct Access Pattern
    queryFn: () => fetchDisciplines(getToken()), // Get token directly at the point of use
    enabled: shouldLoad // Always enabled if shouldLoad is true - token check is done inside fetchDisciplines
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
