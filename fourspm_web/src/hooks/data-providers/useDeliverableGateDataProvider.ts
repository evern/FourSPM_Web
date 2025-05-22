import { useQuery } from '@tanstack/react-query';
import { DELIVERABLE_GATES_ENDPOINT } from '../../config/api-endpoints';
import { useToken } from '../../contexts/token-context';
import { useODataStore } from '../../stores/odataStores';
import { DeliverableGate } from '../../types/odata-types';
import { baseApiService } from '../../api/base-api.service';

/**
 * Fetch deliverable gates data from the API
 * @param token Authentication token
 * @returns Promise with array of deliverable gates
 */
const fetchDeliverableGates = async (token: string | null): Promise<DeliverableGate[]> => {
  if (!token) {
    console.error('fetchDeliverableGates: No token provided');
    throw new Error('Authentication token is required');
  }
  
  const response = await baseApiService.request(DELIVERABLE_GATES_ENDPOINT, {
    token // Pass token explicitly to API service
  });
  const data = await response.json();
  return data.value || [];
};

/**
 * Interface for deliverable gate data provider result
 */
export interface DeliverableGateDataProviderResult {
  // New naming pattern
  deliverableGates: DeliverableGate[];
  deliverableGatesStore: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}

/**
 * Data provider hook for deliverable gate data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the deliverable gates store, data array, loading state, and helper methods
 */
export const useDeliverableGateDataProvider = (shouldLoad: boolean | undefined = true): DeliverableGateDataProviderResult => {
  // Get token from the TokenContext
  const { token } = useToken();

  // Create a store for OData operations with token
  const deliverableGatesStore = useODataStore(DELIVERABLE_GATES_ENDPOINT, 'guid', {
    token // Pass token to ODataStore
  });

  // Use React Query to fetch and cache deliverable gates
  const { 
    data: deliverableGates = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['deliverableGates', token], // Include token in query key to refetch when token changes
    queryFn: () => fetchDeliverableGates(token), // Pass token to fetchDeliverableGates
    enabled: !!token && shouldLoad // Only fetch if we have a token and shouldLoad is true
  });
  
  const error = queryError as Error | null;

  return {
    // New naming pattern
    deliverableGates,
    deliverableGatesStore,
    isLoading,
    error,
    refetch
  };
};
