import { API_CONFIG } from '../config/api';
import { DeliverableGate } from '../types/progress';

/**
 * Fetch all deliverable gates from the API
 * @param userToken The user's authentication token
 * @returns A promise resolving to an array of deliverable gates
 */
export const fetchDeliverableGates = async (userToken: string): Promise<DeliverableGate[]> => {
  if (!userToken) {
    throw new Error('No auth token available');
  }
  
  const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/DeliverableGates`, {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch deliverable gates: ${await response.text()}`);
  }
  
  const data = await response.json();
  return data.value || [];
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
  console.log(`Updating deliverable ${deliverableKey} to gate ${gateGuid}`);
  
  const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Deliverables(${deliverableKey})`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deliverableGateGuid: gateGuid
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update deliverable gate');
  }
};
