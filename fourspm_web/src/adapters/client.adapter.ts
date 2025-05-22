import { apiService } from '../api/api.service';
import { Client } from '../types/index';
import { CLIENTS_ENDPOINT } from '../config/api-endpoints';

/**
 * Client data adapter - provides methods for fetching and manipulating client data
 */

/**
 * Gets all clients
 * @param token Authentication token
 * @returns Array of clients
 */
export const getClients = async (token: string): Promise<Client[]> => {
  try {
    const response = await apiService.getAll<Client>(CLIENTS_ENDPOINT, token);
    return response.value || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Gets client details by ID
 * @param clientId Client GUID
 * @param token Authentication token
 * @returns Client details
 */
export const getClientDetails = async (clientId: string, token: string): Promise<Client> => {
  try {
    return await apiService.getById<Client>(CLIENTS_ENDPOINT, clientId, token);
  } catch (error) {
    console.error(`Error fetching client details for ID ${clientId}:`, error);
    throw error;
  }
};
