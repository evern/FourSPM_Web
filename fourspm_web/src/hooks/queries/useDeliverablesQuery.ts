import { useQuery } from '@tanstack/react-query';
import { DELIVERABLES_ENDPOINT } from '../../config/api-endpoints';
import { baseApiService } from '../../api/base-api.service';
import { Deliverable } from '../../types/odata-types';

/**
 * Fetch deliverables from the API
 * @param projectId Project ID to filter deliverables by
 * @returns Promise with array of deliverables
 */
export const fetchDeliverables = async (projectId?: string): Promise<Deliverable[]> => {
  // Make sure to follow the established pattern for OData filters with GUIDs
  // As per memory [96c469d2-bd38-49d2-95fe-b45cdd7934cc], don't wrap GUIDs in quotes
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : '';
  const url = `${DELIVERABLES_ENDPOINT}?${filter}`;
  
  const response = await baseApiService.request(url);
  const data = await response.json();
  
  return data.value || [];
};

/**
 * Custom hook to query deliverables data using React Query
 * @param projectId Optional project ID to filter deliverables by
 */
export const useDeliverablesQuery = (projectId?: string) => {
  return useQuery({
    queryKey: ['deliverables', projectId],
    queryFn: () => fetchDeliverables(projectId),
    enabled: !!projectId, // Only fetch if projectId is provided
  });
};

/**
 * Enhanced hook that provides additional helper functions
 * @param projectId Optional project ID to filter deliverables by
 */
export const useDeliverablesWithUtils = (projectId?: string) => {
  const query = useDeliverablesQuery(projectId);
  const { data: deliverables = [] } = query;
  
  // Helper function to create a DevExtreme-compatible data source
  const createDataSource = () => {
    return {
      load: () => Promise.resolve(deliverables),
      byKey: (key: string) => {
        // First look for exact GUID match
        const foundItem = deliverables.find(d => d.guid === key);
        if (foundItem) return Promise.resolve(foundItem);
        
        // Then check originalDeliverableGuid for Edit/Original transitions
        // This follows the pattern in memory [c49fa412-5ce1-4bf6-8c87-3f846f97ec01]
        return Promise.resolve(
          deliverables.find(d => d.originalDeliverableGuid === key) || null
        );
      },
    };
  };
  
  // Return the enhanced result
  return {
    ...query,
    deliverables,
    dataSource: createDataSource()
  };
};
