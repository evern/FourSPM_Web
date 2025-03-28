import { sharedApiService } from '../api/shared-api.service';
import { baseApiService } from '../api/base-api.service';
import { API_CONFIG } from '../config/api';
import { createProjectFilter } from '../utils/odata-filters';
import { DELIVERABLES_ENDPOINT } from '../config/api-endpoints';

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
 * @param excludeDeliverableGuid Optional GUID of deliverable to exclude from suggestion
 * @returns Suggested document number
 */
export const getSuggestedDocumentNumber = async (
  projectId: string, 
  deliverableTypeId: string,
  areaNumber: string, 
  discipline: string, 
  documentType: string,
  token: string,
  excludeDeliverableGuid?: string
): Promise<string> => {
  try {
    const url = `${DELIVERABLES_ENDPOINT}/SuggestInternalDocumentNumber` +
               `?projectGuid=${encodeURIComponent(projectId)}` +
               `&deliverableTypeId=${encodeURIComponent(deliverableTypeId)}` +
               `&areaNumber=${encodeURIComponent(areaNumber)}` +
               `&discipline=${encodeURIComponent(discipline)}` +
               `&documentType=${encodeURIComponent(documentType)}` +
               `${excludeDeliverableGuid ? `&excludeDeliverableGuid=${encodeURIComponent(excludeDeliverableGuid)}` : ''}`;
    
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
