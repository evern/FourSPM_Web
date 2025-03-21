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

    if (values.totalPercentageEarnt === undefined) {
      console.error('No totalPercentageEarnt provided for progress update');
      return Promise.reject('No totalPercentageEarnt provided for progress update');
    }

    const token = localStorage.getItem('user') ? 
      JSON.parse(localStorage.getItem('user') || '{}').token : null;
    
    console.log(`Updating progress for deliverable ${key} to ${values.totalPercentageEarnt * 100}% for period ${periodId}`);

    // Prepare the data for the API call
    const progressData = {
      guid: uuidv4(),
      deliverableGuid: key,
      period: periodId,
      units: oldData && oldData.totalHours ? oldData.totalHours * values.totalPercentageEarnt : 0,
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
