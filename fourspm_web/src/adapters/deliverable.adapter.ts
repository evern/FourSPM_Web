import { baseApiService } from '../api/base-api.service';
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
  
  // Variation-specific fields
  variationStatus?: number;    // 0:Standard, 1:UnapprovedVariation, 2:ApprovedVariation, 3:UnapprovedCancellation, 4:ApprovedCancellation
  variationGuid?: string;      // GUID of the variation this deliverable is associated with
  originalDeliverableGuid?: string; // GUID of the original deliverable (if this is a variation copy)
  approvedVariationHours?: number; // Approved variation hours
}

/**
 * Deliverables data adapter - provides methods for fetching and manipulating deliverable data
 */

/**
 * Gets all deliverables with optional project filtering
 * @param token Authentication token
 * @param projectId Optional project GUID to filter deliverables
 * @returns Array of deliverables
 */
export const getDeliverables = async (token: string, projectId?: string): Promise<Deliverable[]> => {
  try {
    let query = '';
    if (projectId) {
      // Validate projectId first
      if (!projectId) {
        throw new Error('Invalid project ID provided');
      }
      query = createProjectFilter(projectId);
    }
    
    // Build the URL with query parameters
    const queryParams = query ? `?$filter=${encodeURIComponent(query)}` : '';
    const url = `${DELIVERABLES_ENDPOINT}${queryParams}`;
    
    // Use baseApiService directly with explicit token passing
    if (!token) {
      throw new Error('Authentication token is required for fetching deliverables');
    }
    
    const response = await baseApiService.request(url, {
      method: 'GET',
      token
    });
    
    const data = await response.json();
    return data.value || [];
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
    
    // Ensure token is available
    if (!token) {
      throw new Error('Authentication token is required for generating document numbers');
    }
    
    // Use the baseApiService with explicit token passing
    const response = await baseApiService.request(url, {
      method: 'GET',
      token
    });
    
    const data = await response.json();
    return data.suggestedNumber || '';
  } catch (error) {
    console.error('Error fetching suggested document number:', error);
    throw error;
  }
};

/**
 * Update a deliverable's gate
 * @param deliverableKey The GUID of the deliverable to update
 * @param gateGuid The GUID of the new gate
 * @param token Authentication token
 * @returns A promise that resolves when the update is complete
 */
export const updateDeliverableGate = async (
  deliverableKey: string, 
  gateGuid: string,
  token: string
): Promise<void> => {
  try {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    
    if (!deliverableKey) {
      throw new Error('Deliverable GUID is required');
    }
    
    if (!gateGuid) {
      throw new Error('Gate GUID is required');
    }
    
    // Construct URL for the PATCH operation
    const url = `${DELIVERABLES_ENDPOINT}(${deliverableKey})`;
    
    // Only send the specific field being updated
    const patchBody = { gateGuid };
    
    // Use baseApiService with token
    await baseApiService.request(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patchBody),
      token
    });
  } catch (error) {
    console.error('Error updating deliverable gate:', error);
    throw error;
  }
};


