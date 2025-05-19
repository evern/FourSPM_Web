// Progress data adapter - provides methods for manipulating progress data
import { v4 as uuidv4 } from 'uuid';
import { DeliverableProgressDto } from '../types/index';
import { sharedApiService } from '../api/shared-api.service';
import { PROGRESS_ENDPOINT } from '../config/api-endpoints';

/**
 * Custom function to handle progress updates
 * @param key The deliverable GUID
 * @param values The updated values
 * @param periodId The period to update
 * @param oldData Previous data from the row
 * @param token Authentication token for API access
 * @returns A promise that resolves when the update is complete
 */
export const handleProgressUpdate = async (
  key: string, 
  values: Partial<DeliverableProgressDto>, 
  periodId: number, 
  oldData?: Partial<DeliverableProgressDto>,
  token?: string
) => {
  try {
    // Make sure we have the required data
    if (!key) {
      console.error('No key provided for progress update');
      return Promise.reject('No key provided for progress update');
    }

    if (values.cumulativeEarntPercentage === undefined) {
      console.error('No cumulativeEarntPercentage provided for progress update');
      return Promise.reject('No cumulativeEarntPercentage provided for progress update');
    }

    // Return early if no token is provided
    if (!token) {
      console.error('No token provided for progress update');
      return Promise.reject('No token provided for progress update');
    }
    
    const authToken = token;
    
    // Calculate period-specific percentage (the change since the previous period)
    const previousPeriodPercentage = oldData?.previousPeriodEarntPercentage || 0;
    const totalEarnedPercentage = values.cumulativeEarntPercentage;
    const currentPeriodPercentage = Math.max(0, totalEarnedPercentage - previousPeriodPercentage);
    
    // Determine the total hours - using the value from oldData if available
    const totalHours = oldData?.totalHours || 0;

    // Prepare the data for the API call
    const progressData = {
      guid: uuidv4(),
      deliverableGuid: key,
      period: periodId,
      cumulativeEarntPercentage: totalEarnedPercentage, // Total earned percentage up to this period
      currentPeriodEarntPercentage: currentPeriodPercentage, // Percentage earned specifically in this period
      units: currentPeriodPercentage * totalHours, // Calculate units based on the available totalHours
      createdBy: JSON.parse(localStorage.getItem('user') || '{}').accountId,
    };
    
    // Use the shared API service to make the request
    const result = await sharedApiService.post<any>(
      `${PROGRESS_ENDPOINT}/AddOrUpdateExisting`,
      progressData
    );

    // Return both the server response and the original key for row identification
    return Promise.resolve({
      result,
      deliverableGuid: key,
      progressData
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return Promise.reject(`Error updating progress: ${error}`);
  }
};
