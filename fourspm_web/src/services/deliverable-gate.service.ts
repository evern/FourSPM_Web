import { DeliverableGate } from '../types/progress';
import { sharedApiService } from './api/shared-api.service';

/**
 * Fetch all deliverable gates from the API
 * @param userToken The user's authentication token
 * @returns A promise resolving to an array of deliverable gates
 */
export const fetchDeliverableGates = async (userToken: string): Promise<DeliverableGate[]> => {
  return sharedApiService.getAll<DeliverableGate>('/odata/v1/DeliverableGates', userToken);
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
  
  return sharedApiService.update<any>(
    '/odata/v1/Deliverables',
    deliverableKey,
    { deliverableGateGuid: gateGuid },
    userToken
  );
};
