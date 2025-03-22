import { v4 as uuidv4 } from 'uuid';
import { DeliverableRowData } from '../types/progress';
import { sharedApiService } from './api/shared-api.service';

/**
 * Custom function to handle progress updates
 * @param key The deliverable GUID
 * @param values The updated values
 * @param periodId The period to update
 * @param oldData Previous data from the row
 * @returns A promise that resolves when the update is complete
 */
export const handleProgressUpdate = async (
  key: string, 
  values: Partial<DeliverableRowData>, 
  periodId: number, 
  oldData?: Partial<DeliverableRowData>
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

    const token = localStorage.getItem('user') ? 
      JSON.parse(localStorage.getItem('user') || '{}').token : null;
    
    // Calculate period-specific percentage (the change since the previous period)
    const previousPeriodPercentage = oldData?.previousPeriodEarntPercentage || 0;
    const totalEarnedPercentage = values.cumulativeEarntPercentage;
    const currentPeriodPercentage = Math.max(0, totalEarnedPercentage - previousPeriodPercentage);
    
    console.log(`Updating progress for deliverable ${key}:`);
    console.log(`- Total earned up to period ${periodId}: ${totalEarnedPercentage * 100}%`);
    console.log(`- Previous period total: ${previousPeriodPercentage * 100}%`);
    console.log(`- Current period change: ${currentPeriodPercentage * 100}%`);

    // Prepare the data for the API call
    const progressData = {
      guid: uuidv4(),
      deliverableGuid: key,
      period: periodId,
      cumulativeEarntPercentage: totalEarnedPercentage, // Total earned percentage up to this period
      currentPeriodEarntPercentage: currentPeriodPercentage, // Percentage earned specifically in this period
      units: oldData && oldData.totalHours ? oldData.totalHours * currentPeriodPercentage : 0,
      createdBy: JSON.parse(localStorage.getItem('user') || '{}').accountId,
    };

    // Use the shared API service to make the request
    const result = await sharedApiService.post<any>(
      '/odata/v1/Progress/AddOrUpdateExisting',
      token,
      progressData
    );

    console.log('Progress update successful:', result);
    return Promise.resolve(result);
  } catch (error) {
    console.error('Error updating progress:', error);
    return Promise.reject(`Error updating progress: ${error}`);
  }
};
