import { sharedApiService } from '../api/shared-api.service';
import { baseApiService } from '../api/base-api.service';
import { API_CONFIG } from '../config/api';
import { createProjectFilter } from '../utils/odata-filters';
import { DELIVERABLES_ENDPOINT, getDeliverablesByVariationUrl } from '../config/api-endpoints';

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

/**
 * Interface for a variation deliverable request
 */
export interface VariationDeliverableRequest {
  originalDeliverableGuid: string; // GUID of the original deliverable to create a variation for
  variationGuid: string;          // GUID of the variation
  variationHours: number;         // Hours to add or remove with this variation
  isCancellation?: boolean;       // Whether this is a cancellation (default: false)
  documentTitle?: string;         // Optional override for document title
  documentType?: string;          // Optional override for document type
  clientDocumentNumber?: string;  // Optional override for client document number
}

/**
 * Add or update a variation copy of an existing deliverable
 * @param request The variation deliverable request details
 * @param token User authentication token
 * @returns The created or updated variation deliverable
 */
export const addOrUpdateVariationDeliverable = async (
  request: VariationDeliverableRequest,
  token: string
): Promise<Deliverable> => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    
    // Validate required fields
    if (!request.originalDeliverableGuid) {
      throw new Error('Original deliverable GUID is required');
    }
    
    if (!request.variationGuid) {
      throw new Error('Variation GUID is required');
    }
    
    const url = `${DELIVERABLES_ENDPOINT}/AddOrUpdateVariation`;
    
    // Create the request payload
    const payload = {
      originalDeliverableGuid: request.originalDeliverableGuid,
      variationGuid: request.variationGuid,
      variationHours: request.variationHours || 0,
      isCancellation: request.isCancellation || false,
      documentTitle: request.documentTitle,
      documentType: request.documentType,
      clientDocumentNumber: request.clientDocumentNumber
    };
    
    // Use the baseApiService which already handles token management
    const response = await baseApiService.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding or updating variation deliverable:', error);
    throw error;
  }
};

/**
 * Create a brand new deliverable for a variation (not a copy of an existing one)
 * @param deliverable The deliverable data to create
 * @param variationGuid The GUID of the variation
 * @param token User authentication token
 * @returns The created deliverable
 */
export const createNewVariationDeliverable = async (
  deliverable: Partial<Deliverable>,
  variationGuid: string,
  token: string
): Promise<Deliverable> => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    
    if (!variationGuid) {
      throw new Error('Variation GUID is required');
    }
    
    const url = `${DELIVERABLES_ENDPOINT}/CreateForVariation`;
    
    // Ensure the variation GUID is set
    const payload = {
      ...deliverable,
      variationGuid: variationGuid,
      // Set default values for remaining fields if not provided
      bookingCode: deliverable.bookingCode || '',
      clientDocumentNumber: deliverable.clientDocumentNumber || '',
      projectNumber: deliverable.projectNumber || '',
      totalCost: deliverable.totalCost || 0,
      totalHours: deliverable.totalHours || 0,
      variationHours: deliverable.variationHours || 0
    };
    
    // Use the baseApiService which already handles token management
    const response = await baseApiService.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating new variation deliverable:', error);
    throw error;
  }
};

/**
 * Gets all deliverables for a specific variation
 * @param variationGuid The GUID of the variation
 * @param token User authentication token
 * @returns Array of deliverables associated with the variation
 */
export const getDeliverablesByVariation = async (
  variationGuid: string,
  token: string
): Promise<Deliverable[]> => {
  if (!token) {
    throw new Error('Token is required');
  }
  
  if (!variationGuid) {
    throw new Error('Variation GUID is required');
  }
  
  try {
    const url = getDeliverablesByVariationUrl(variationGuid);
    const response = await sharedApiService.get<any>(url, token);
    return response.value || [];
  } catch (error) {
    console.error('Error fetching variation deliverables:', error);
    throw error;
  }
};

/**
 * Cancels a deliverable by setting its variationStatus to UnapprovedCancellation using OData PATCH
 * @param deliverableGuid The GUID of the deliverable to cancel
 * @param token User authentication token
 * @returns The updated deliverable with cancellation status
 */
export const cancelDeliverable = async (
  deliverableGuid: string,
  token: string
): Promise<Deliverable> => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    
    if (!deliverableGuid) {
      throw new Error('Deliverable GUID is required');
    }
    
    // Following established OData pattern
    const url = `${DELIVERABLES_ENDPOINT}(${deliverableGuid})`;
    
    // Only send the specific field being updated
    const patchBody = {
      // Using string value for enum as per OData serialization requirements
      variationStatus: 'UnapprovedCancellation'
    };
    
    // Use the baseApiService which handles token management
    const response = await baseApiService.request(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'  // Ask server to return updated entity
      },
      body: JSON.stringify(patchBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to cancel deliverable: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error cancelling deliverable:', error);
    throw error;
  }
};

/**
 * Interface for deliverable progress update request
 */
export interface DeliverableProgressUpdate {
  deliverableGuid: string;
  projectGuid: string;
  cumulativeEarntPercentage: number;
  period: number;
  progressDate: string;
}

/**
 * Updates the progress percentage for a deliverable
 * @param progressUpdate The progress update details
 * @param token User authentication token
 * @returns Promise that resolves when the update is complete
 */
export const updateDeliverableProgress = async (
  progressUpdate: DeliverableProgressUpdate,
  token: string
): Promise<void> => {
  try {
    if (!token) {
      throw new Error('Token is required');
    }
    
    if (!progressUpdate.deliverableGuid) {
      throw new Error('Deliverable GUID is required');
    }

    if (!progressUpdate.projectGuid) {
      throw new Error('Project GUID is required');
    }
    
    // Following established pattern for custom operations
    const url = `${DELIVERABLES_ENDPOINT}/UpdateProgress`;
    
    // Use the baseApiService which handles token management
    const response = await baseApiService.request(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(progressUpdate)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update deliverable progress: ${response.status} ${errorText}`);
    }
  } catch (error) {
    console.error('Error updating deliverable progress:', error);
    throw error;
  }
};
