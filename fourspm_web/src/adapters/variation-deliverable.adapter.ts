/**
 * Adapter functions for variation deliverable operations
 * Following the established pattern for API interaction
 */

import { 
  DELIVERABLES_ENDPOINT, 
  VARIATION_DELIVERABLES_ENDPOINT, 
  getVariationDeliverablesEndpoint,
  getCancelDeliverableUrl
} from '../config/api-endpoints';
import { VariationDeliverableUiStatus } from '../types/app-types';
import { Deliverable } from '../types/odata-types';
import { getAuthHeaders } from '../utils/auth-headers';


/**
 * Get all deliverables for a specific variation using the new VariationDeliverables endpoint
 * @param variationGuid The variation GUID
 * @returns Promise with array of deliverables
 */
export async function getVariationDeliverables(variationGuid: string): Promise<Deliverable[]> {
  // Use the dedicated OData endpoint with filter for variationGuid
  const endpoint = getVariationDeliverablesEndpoint(variationGuid);
  
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders() // MSAL authentication is used internally
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get variation deliverables: ${errorText}`);
  }
  
  const data = await response.json();
  
  // Standard OData response format with 'value' property containing the array
  const deliverables = data.value || [];
  return deliverables.filter((d: any) => d !== null && d !== undefined) as Deliverable[];
}

/**
 * Add an existing deliverable to a variation (creates a copy with 'Edit' status)
 * @param deliverable The complete deliverable entity with all required properties
 */
export async function addExistingDeliverableToVariation(
  deliverable: Deliverable
): Promise<Deliverable> {
  // Use the complete deliverable entity that was provided
  // This includes all the necessary fields for OData serialization
  
  // Safety check: Skip updating if no originalDeliverableGuid is provided
  // This follows the key alignment pattern from our grid implementation
  if (!deliverable.originalDeliverableGuid) {
    console.error('Cannot update deliverable without originalDeliverableGuid');
    throw new Error('Missing originalDeliverableGuid for variation deliverable');
  }
  
  // Use PATCH method for the VariationDeliverables endpoint
  // When using originalDeliverableGuid as the key (following our established pattern)
  const originalGuid = deliverable.originalDeliverableGuid;
  
  // If we have an existing variation copy with a guid, use that for the update
  // If not, we'll be creating a new variation copy based on the original
  const targetGuid = deliverable.guid;

  const response = await fetch(`${VARIATION_DELIVERABLES_ENDPOINT}(${targetGuid})`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(), // MSAL authentication is used internally
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'  // Request that the server return the updated entity
    },
    body: JSON.stringify({
      ...deliverable,
      originalDeliverableGuid: originalGuid
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add deliverable to variation: ${errorText}`);
  }
  
  // Parse and return the updated entity from the server
  const updatedEntity = await response.json();
  return updatedEntity;
}

/**
 * Cancel a deliverable in a variation
 * @param originalDeliverableGuid The GUID of the original deliverable to cancel
 * @param variationGuid The GUID of the variation this cancellation belongs to
 * @returns The cancelled deliverable entity with updated status
 */
export async function cancelDeliverableVariation(
  originalDeliverableGuid: string,
  variationGuid: string
): Promise<any> {
  // Use our new dedicated cancellation endpoint
  const url = getCancelDeliverableUrl(originalDeliverableGuid, variationGuid);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(), // MSAL authentication is used internally
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel deliverable: ${errorText}`);
  }
  
  // Parse and return the updated entity from the server
  const updatedEntity = await response.json();
  return updatedEntity;
}

/**
 * Add a new deliverable to a variation
 * @param data The deliverable data
 * @param token Authentication token
 * @returns Promise containing the created deliverable entity with server-calculated fields
 */
export async function addNewDeliverableToVariation(
  data: Deliverable,
  token: string
): Promise<Deliverable> {
  // Use POST to the VariationDeliverables endpoint for creating new entities
  const response = await fetch(`${VARIATION_DELIVERABLES_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add deliverable to variation: ${errorText}`);
  }
  
  return await response.json();
}