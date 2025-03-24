import { sharedApiService } from './api/shared-api.service';
import { ClientDetails } from '../types/project';

/**
 * Interface for Client entity
 */
export interface Client {
  guid: string;
  number: string;
  description: string;
  clientContact?: string | null;
  clientContactName?: string | null;
  clientContactNumber?: string | null;
  clientContactEmail?: string | null;
}

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
export const getClientDetails = async (clientId: string, token: string): Promise<ClientDetails> => {
  try {
    const data = await sharedApiService.getById<Client>('/odata/v1/Clients', clientId, token);
    
    return {
      guid: data.guid,
      number: data.number,
      description: data.description,
      clientContact: data.clientContact || null,
      // Include the additional contact fields that may be used elsewhere
      clientContactName: data.clientContactName || null,
      clientContactNumber: data.clientContactNumber || null,
      clientContactEmail: data.clientContactEmail || null
    } as ClientDetails;
  } catch (error) {
    console.error('Error fetching client details:', error);
    throw error;
  }
};
