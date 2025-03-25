import { sharedApiService } from '../api/shared-api.service';
import { Client } from '../types/index';

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
    return await sharedApiService.getAll<Client>('/odata/v1/Clients', token);
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Gets client details by GUID
 * @param clientId Client GUID
 * @param token User authentication token
 * @returns Client details including contact information
 */
export const getClientDetails = async (clientId: string, token: string): Promise<Client> => {
  try {
    const data = await sharedApiService.getById<Client>('/odata/v1/Clients', clientId, token);
    
    // Ensure null handling for contact fields
    return {
      ...data,
      clientContactName: data.clientContactName || null,
      clientContactNumber: data.clientContactNumber || null,
      clientContactEmail: data.clientContactEmail || null
    };
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
  }
};
