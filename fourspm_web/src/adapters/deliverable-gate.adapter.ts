import { DeliverableGate } from '../types/odata-types';
import { sharedApiService } from '../api/shared-api.service';
import { DELIVERABLE_GATES_ENDPOINT, DELIVERABLES_ENDPOINT } from '../config/api-endpoints';

/**
 * Deliverable Gate data adapter - provides methods for fetching and manipulating deliverable gate data
 */

/**
 * Fetch all deliverable gates from the API
 * @param userToken The user's authentication token
 * @returns A promise resolving to an array of deliverable gates
 */
export const fetchDeliverableGates = async (userToken: string): Promise<DeliverableGate[]> => {
  return sharedApiService.getAll<DeliverableGate>(DELIVERABLE_GATES_ENDPOINT, userToken);
};
