import { sharedApiService } from '../api/shared-api.service';
import { baseApiService } from '../api/base-api.service';
import { API_CONFIG } from '../config/api';

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
      query = `$filter=projectGuid eq '${projectId}'`;
    }
    
    return await sharedApiService.getAll<Deliverable>('/odata/v1/Deliverables', token, query);
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    throw error;
  }
};

/**
 * Gets a specific deliverable by GUID
 * @param deliverableId Deliverable GUID
 * @param token User authentication token
 * @returns Deliverable details
 */
export const getDeliverableDetails = async (deliverableId: string, token: string): Promise<Deliverable> => {
  try {
    return await sharedApiService.getById<Deliverable>('/odata/v1/Deliverables', deliverableId, token);
  } catch (error) {
    console.error('Error fetching deliverable details:', error);
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
    const url = `${API_CONFIG.baseUrl}/odata/v1/Deliverables/SuggestInternalDocumentNumber` +
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
