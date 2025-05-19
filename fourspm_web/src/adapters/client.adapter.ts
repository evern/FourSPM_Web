import { sharedApiService } from '../api/shared-api.service';
import { Client } from '../types/index';
import { CLIENTS_ENDPOINT } from '../config/api-endpoints';

/**
 * Client data adapter - provides methods for fetching and manipulating client data
 */

/**
 * Gets all clients
 * @returns Array of clients
 */
export const getClients = async (): Promise<Client[]> => {
  try {
    return await sharedApiService.getAll<Client>(CLIENTS_ENDPOINT);
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Gets client details by ID
 * @param clientId Client GUID
 * @returns Client details
 */
export const getClientDetails = async (clientId: string): Promise<Client> => {
  try {
    return await sharedApiService.getById<Client>(CLIENTS_ENDPOINT, clientId);
  } catch (error) {
    console.error(`Error fetching client details for ID ${clientId}:`, error);
    throw error;
  }
};
