import { sharedApiService } from '../api/shared-api.service';
import { baseApiService } from '../api/base-api.service';
import { API_CONFIG } from '../config/api';
import { createProjectFilter } from '../utils/odata-filters';
import { DELIVERABLES_ENDPOINT, getDeliverablesWithProgressQuery } from '../config/api-endpoints';

/**
 * Represents a Deliverable entity with backend-calculated fields
 */
export interface Deliverable {
  guid: string;
  projectGuid: string;
  clientNumber: string;        // Calculated from Project on server
  projectNumber: string;       // Calculated from Project on server
  areaNumber: string;
  discipline: string;
  documentType: string;
  departmentId: string;
  deliverableTypeId: number;   // Enum: 0:Task, 1:NonDeliverable, 2:DeliverableICR, 3:Deliverable
  internalDocumentNumber: string;  // Generated on server
  clientDocumentNumber: string;
  documentTitle: string;
  budgetHours: number;
  variationHours: number;
  totalHours: number;          // Calculated as sum of budget and variation hours
  totalCost: number;
  bookingCode: string;         // Calculated as ClientNumber-ProjectNumber-AreaNumber-Discipline
}

/**
 * Deliverables data adapter - provides methods for fetching and manipulating deliverable data
 */

/**
 * Gets all deliverables, optionally filtered by project
 * @param token User authentication token
 * @param projectId Optional project GUID to filter deliverables
 * @returns Array of deliverables
 */
export const getDeliverables = async (token: string, projectId?: string): Promise<Deliverable[]> => {
  if (!token) {
    throw new Error('Token is required');
  }
  
  try {
    let query = '';
    if (projectId) {
      // Validate projectId first
      if (!projectId) {
        throw new Error('Invalid project ID provided');
      }
      query = createProjectFilter(projectId);
    }
    
    return await sharedApiService.getAll<Deliverable>(DELIVERABLES_ENDPOINT, token, query);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    throw error;
  }
};

/**
 * Gets a suggested internal document number from the server
 * @param projectId Project GUID
 * @param deliverableTypeId Deliverable type ID (enum value)
 * @param areaNumber Area number
 * @param discipline Discipline code
 * @param documentType Document type
 * @param token User authentication token
 * @returns Suggested document number
 */
export const getSuggestedDocumentNumber = async (
  projectId: string, 
  deliverableTypeId: string,
  areaNumber: string, 
  discipline: string, 
  documentType: string,
  token: string
): Promise<string> => {
  try {
    const url = `${DELIVERABLES_ENDPOINT}/SuggestInternalDocumentNumber` +
               `?projectGuid=${encodeURIComponent(projectId)}` +
               `&deliverableTypeId=${encodeURIComponent(deliverableTypeId)}` +
               `&areaNumber=${encodeURIComponent(areaNumber)}` +
               `&discipline=${encodeURIComponent(discipline)}` +
               `&documentType=${encodeURIComponent(documentType)}`;
    
    // Use the baseApiService which already handles token management
    const response = await baseApiService.request(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    return data.suggestedNumber || '';
  } catch (error) {
    console.error('Error fetching document number:', error);
    return '';
  }
};

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
    // Use the standardized query function from api-endpoints.ts
    const query = getDeliverablesWithProgressQuery(projectId, period);
    
    const result = await sharedApiService.getAll<any>(
      DELIVERABLES_ENDPOINT,
      userToken,
      query
    );
    
    // Process the result to calculate percentages similar to what the backend was doing
    const processedResults = result.map(deliverable => {
      // Calculate progress percentages based on deliverable gate and progress items
      const gate = deliverable.deliverableGate || {};
      const maxPercentage = gate.maxPercentage || 100;
      const progressItems = deliverable.progressItems || [];
      
      // Sum up units from progress items for this period
      const periodUnits = progressItems.reduce((sum: number, item: any) => {
        return sum + (item.period === period ? Number(item.units) || 0 : 0);
      }, 0);
      
      // Calculate percentage based on total hours
      const totalHours = Number(deliverable.totalHours) || 0;
      const earnedPercentage = totalHours > 0 ? (periodUnits / totalHours) * 100 : 0;
      
      // Apply max percentage limit from gate if available
      const cappedPercentage = Math.min(earnedPercentage, maxPercentage);
      
      return {
        ...deliverable,
        periodEarntPercentage: earnedPercentage,
        cumulativeEarntPercentage: cappedPercentage,
        totalUnits: periodUnits
      };
    });
    
    return processedResults;
  } catch (error) {
    console.error('Error fetching deliverables with progress percentages:', error);
    throw error;
  }
};

/**
 * Update a deliverable's gate
 * @param deliverableKey The GUID of the deliverable to update
 * @param gateGuid The GUID of the new gate
 * @param userToken The user's authentication token
 * @returns A promise that resolves when the update is complete
 */
export const updateDeliverableGate = async (
  deliverableKey: string, 
  gateGuid: string, 
  userToken: string
): Promise<void> => {
  try {
    // Create the request payload
    const payload = {
      deliverableGateGuid: gateGuid
    };

    return sharedApiService.update<any>(
      DELIVERABLES_ENDPOINT,
      deliverableKey,
      payload,
      userToken
    );
  } catch (error) {
    console.error(`Error updating deliverable ${deliverableKey} to gate ${gateGuid}: ${error}`);
    throw error;
  }
};
