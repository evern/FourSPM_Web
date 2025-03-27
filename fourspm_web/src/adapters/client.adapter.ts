import { sharedApiService } from '../api/shared-api.service';
import { Client } from '../types/index';
import { CLIENTS_ENDPOINT } from '../config/api-endpoints';

/**
 * Client data adapter - provides methods for fetching and manipulating client data
 */

/**
 * Gets all clients
 * @param token User authentication token
 * @returns Array of clients
 */
export const getClients = async (token: string): Promise<Client[]> => {
  try {
    return await sharedApiService.getAll<Client>(CLIENTS_ENDPOINT, token);
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Gets client details by ID
 * @param clientId Client GUID
 * @param token User authentication token
 * @returns Client details
 */
export const getClientDetails = async (clientId: string, token: string): Promise<Client> => {
  try {
    return await sharedApiService.getById<Client>(CLIENTS_ENDPOINT, clientId, token);
  } catch (error) {
    console.error(`Error fetching client details for ID ${clientId}:`, error);
    throw error;
  }
};
