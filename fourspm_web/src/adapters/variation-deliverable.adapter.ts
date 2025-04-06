/**
 * Adapter functions for variation deliverable operations
 * Following the established pattern for API interaction
 */

import { DELIVERABLES_ENDPOINT } from '../config/api-endpoints';
import { VariationDeliverableUiStatus } from '../types/app-types';
import { Deliverable } from '../types/odata-types';
import { getAuthHeaders } from '../utils/auth-headers';

/**
 * Get all deliverables for a specific project
 * @param projectGuid The project GUID
 * @param token Optional auth token
 * @returns Promise with array of deliverables
 */
export async function getProjectDeliverables(projectGuid: string, token?: string): Promise<Deliverable[]> {
  const response = await fetch(`${DELIVERABLES_ENDPOINT}/ByProject/${projectGuid}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  const data = await response.json();
  const deliverables = data.value.filter((d: any) => d !== null && d !== undefined) as Deliverable[];
  return deliverables;
}

/**
 * Get all deliverables for a specific variation
 * @param variationGuid The variation GUID
 * @param token Optional auth token
 * @returns Promise with array of deliverables
 */
export async function getVariationDeliverables(variationGuid: string, token?: string): Promise<Deliverable[]> {
  const response = await fetch(`${DELIVERABLES_ENDPOINT}/ByVariation/${variationGuid}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  
  const data = await response.json();
  
  // Handle both response formats: direct array or {value: array}
  const deliverables = Array.isArray(data) ? data : (data.value || []);
  return deliverables.filter((d: any) => d !== null && d !== undefined) as Deliverable[];
}

/**
 * Add an existing deliverable to a variation (creates a copy with 'Edit' status)
 * @param deliverable The complete deliverable entity with all required properties
 * @param token Optional auth token
 */
export async function addExistingDeliverableToVariation(
  deliverable: Deliverable,
  token?: string
): Promise<Deliverable> {
  // Use the complete deliverable entity that was provided
  // This includes all the necessary fields for OData serialization
  // No need to build a new entity with default values since we're using the existing one

  const response = await fetch(`${DELIVERABLES_ENDPOINT}/AddOrUpdateVariation`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(deliverable)
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
 * Cancel a deliverable in a variation by updating its status
 * @param deliverableGuid The deliverable GUID
 * @param token Optional auth token
 */
export async function cancelDeliverableVariation(
  deliverableGuid: string,
  token?: string
): Promise<void> {
  const patchData = {
    variationStatus: 'UnapprovedCancellation'
  };
  
  await fetch(`${DELIVERABLES_ENDPOINT}(${deliverableGuid})`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patchData)
  });
}

/**
 * Remove a deliverable from a variation
 * @param deliverableGuid The deliverable GUID
 * @param originalDeliverableGuid The original deliverable GUID
 * @param token Optional auth token
 */
export async function removeDeliverableFromVariation(
  deliverableGuid: string,
  originalDeliverableGuid: string,
  token?: string
): Promise<void> {
  // Implementation would go here, following the same pattern as other adapters
  console.log('Remove deliverable from variation - implementation pending');
}

/**
 * Add a new deliverable to a variation
 * @param data The deliverable data
 * @param token Optional auth token
 * @returns Promise containing the created deliverable entity with server-calculated fields
 */
export async function addNewDeliverableToVariation(
  data: Deliverable,
  token?: string
): Promise<Deliverable> {
  const response = await fetch(`${DELIVERABLES_ENDPOINT}/CreateForVariation`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to add deliverable to variation: ${response.statusText}`);
  }
  
  return await response.json();
}