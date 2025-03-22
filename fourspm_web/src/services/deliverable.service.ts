import { sharedApiService } from './api/shared-api.service';

/**
 * Fetch deliverables with progress percentages for a specific project and period
 * @param projectId The project GUID
 * @param period The reporting period
 * @param userToken User authentication token
 * @returns Promise with deliverables including progress percentages
 */
export const getDeliverablesWithProgressPercentages = async (
  projectId: string,
  period: number,
  userToken: string
) => {
  try {
    // The backend now returns the array directly instead of an OData response object
    const result = await sharedApiService.get<any[]>(
      `/odata/v1/Deliverables/GetWithProgressPercentages?projectGuid=${projectId}&period=${period}`,
      userToken
    );
    
    return result;
  } catch (error) {
    console.error('Error fetching deliverables with progress percentages:', error);
    throw error;
  }
};
