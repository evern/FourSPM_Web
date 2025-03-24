import { useState, useCallback } from 'react';
import { getClientDetails, Client } from '../services/client.service';
import notify from 'devextreme/ui/notify';
import Form from 'devextreme-react/form';
import { ClientDetails } from '../types/project';

/**
 * Interface for client contact information
 */
interface ClientContact {
  name: string | null;
  number: string | null;
  email: string | null;
}

/**
 * Hook to manage client data operations
 * @param userToken The user's authentication token
 * @returns Object containing client data state and handler functions
 */
export const useClientData = (userToken: string | undefined) => {
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [selectedClientContact, setSelectedClientContact] = useState<ClientContact>({
    name: null,
    number: null,
    email: null
  });
  const [isLoadingClient, setIsLoadingClient] = useState<boolean>(false);

  /**
   * Handle client selection change
   * @param clientId Client GUID
   * @param formRef Form reference for updating form data
   * @returns Updated contact information
   */
  const handleClientChange = useCallback(async (clientId: string, formRef: Form | null): Promise<ClientContact | null> => {
    if (!userToken || !clientId) return null;
    
    setIsLoadingClient(true);
    try {
      const clientDataResult = await getClientDetails(clientId, userToken);
      if (clientDataResult) {
        setClientDetails(clientDataResult);
        
        const contact: ClientContact = {
          name: clientDataResult.clientContactName || null,
          number: clientDataResult.clientContactNumber || null,
          email: clientDataResult.clientContactEmail || null
        };
        
        setSelectedClientContact(contact);
        
        if (formRef) {
          // Update form with new contact info and update the client object in the form data
          const formData = formRef.instance.option('formData');
          formRef.instance.option('formData', {
            ...formData,
            clientGuid: clientId,
            // Move the contact fields into the client object
            client: {
              guid: clientDataResult.guid,
              number: clientDataResult.number,
              description: clientDataResult.description,
              clientContact: clientDataResult.clientContact,
              clientContactName: clientDataResult.clientContactName || '',
              clientContactNumber: clientDataResult.clientContactNumber || '',
              clientContactEmail: clientDataResult.clientContactEmail || ''
            }
          });
        }
        
        return contact;
      }
      return null;
    } catch (error) {
      console.error('Error fetching client details:', error);
      notify('Error loading client data', 'error', 3000);
      return null;
    } finally {
      setIsLoadingClient(false);
    }
  }, [userToken]);

  /**
   * Load client data for a specific client ID
   * @param clientId Client GUID
   * @returns Client details if successful
   */
  const loadClientData = useCallback(async (clientId: string): Promise<ClientDetails | null> => {
    if (!userToken || !clientId) return null;
    
    setIsLoadingClient(true);
    try {
      const clientDataResult = await getClientDetails(clientId, userToken);
      if (clientDataResult) {
        // Store client details in state
        setClientDetails(clientDataResult);
        
        const contact: ClientContact = {
          name: clientDataResult.clientContactName || null,
          number: clientDataResult.clientContactNumber || null,
          email: clientDataResult.clientContactEmail || null
        };
        
        setSelectedClientContact(contact);
        return clientDataResult;
      }
      return null;
    } catch (error) {
      console.error('Error fetching client details:', error);
      return null;
    } finally {
      setIsLoadingClient(false);
    }
  }, [userToken]);

  return {
    clientDetails,
    selectedClientContact,
    isLoadingClient,
    handleClientChange,
    loadClientData
  };
};
