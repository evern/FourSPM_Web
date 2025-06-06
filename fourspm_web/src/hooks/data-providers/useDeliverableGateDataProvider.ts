import { useQuery } from '@tanstack/react-query';
import { DELIVERABLE_GATES_ENDPOINT } from '../../config/api-endpoints';
import { useODataStore } from '../../stores/odataStores';
import { DeliverableGate } from '../../types/odata-types';
import { baseApiService } from '../../api/base-api.service';

/**
 * Fetch deliverable gates data from the API
 * @returns Promise with array of deliverable gates
 */
const fetchDeliverableGates = async (): Promise<DeliverableGate[]> => {
  const response = await baseApiService.request(DELIVERABLE_GATES_ENDPOINT);
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
  // Create a store for OData operations
  const deliverableGatesStore = useODataStore(DELIVERABLE_GATES_ENDPOINT, 'guid');

  // Use React Query to fetch and cache deliverable gates
  const { 
    data: deliverableGates = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['deliverableGates'],
    queryFn: fetchDeliverableGates
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
