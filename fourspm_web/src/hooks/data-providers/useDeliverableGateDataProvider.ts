import { useQuery } from '@tanstack/react-query';
import { DELIVERABLE_GATES_ENDPOINT } from '../../config/api-endpoints';
import { getToken } from '../../utils/token-store';
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
  // Using Optimized Direct Access Pattern - token retrieved at leaf methods

  // Create a store for OData operations - token access is direct
  const deliverableGatesStore = useODataStore(DELIVERABLE_GATES_ENDPOINT, 'guid', {
    // No token needed here as the store will get it directly when needed
  });

  // Use React Query to fetch and cache deliverable gates - token access is optimized
  const { 
    data: deliverableGates = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['deliverableGates'], // No token dependency in query key - using Optimized Direct Access Pattern
    queryFn: () => fetchDeliverableGates(getToken()), // Get token directly at the point of use
    enabled: shouldLoad // Always enabled if shouldLoad is true - token check is done inside fetchDeliverableGates
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
