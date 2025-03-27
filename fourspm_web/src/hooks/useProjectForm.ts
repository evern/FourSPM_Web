import { useState, useCallback } from 'react';
import { Project } from '../types/index';
import { getClientDetails } from '../adapters/client.adapter';
import Form from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';

interface UseProjectFormProps {
  userToken?: string;
}

/**
 * Hook to manage project form interactions and direct form field updates
 * This hook separates form manipulation from entity data management to prevent UI flickering
 */
export const useProjectForm = ({ userToken }: UseProjectFormProps) => {
  const [formRef, setFormRef] = useState<Form | null>(null);

  /**
   * Set the form reference for accessing form data
   */
  const onFormRef = useCallback((ref: Form) => {
    setFormRef(ref);
  }, []);

  /**
   * Update client contact fields directly in the form
   * This prevents the entire form from re-rendering
   */
  const updateClientFields = useCallback(async (clientId: string): Promise<boolean> => {
    if (!formRef || !userToken) return false;
    
    try {
      console.log('Updating client fields in form for client:', clientId);
      
      // Get client details from API
      const clientDetails = await getClientDetails(clientId, userToken);
      
      if (!clientDetails) {
        throw new Error('Could not load client details');
      }
      
      // Update form fields directly using the form instance methods
      // This is key to preventing flickering as it doesn't trigger a full re-render
      if (clientDetails.clientContactName !== undefined) {
        formRef.instance.updateData('client.clientContactName', clientDetails.clientContactName);
      }
      
      if (clientDetails.clientContactNumber !== undefined) {
        formRef.instance.updateData('client.clientContactNumber', clientDetails.clientContactNumber);
      }
      
      if (clientDetails.clientContactEmail !== undefined) {
        formRef.instance.updateData('client.clientContactEmail', clientDetails.clientContactEmail);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating client fields in form:', error);
      return false;
    }
  }, [formRef, userToken]);

  /**
   * Handle client selection change in the form
   */
  const handleClientChange = useCallback(async (clientId: string, projectData?: Project): Promise<boolean> => {
    if (!clientId) return false;
    
    try {
      // Update form fields directly
      const success = await updateClientFields(clientId);
      
      if (!success) {
        throw new Error('Failed to update client fields');
      }
      
      // If we also have the formData passed in, update it (but form is already updated)
      if (formRef && projectData) {
        // Update the clientGuid in the form data
        formRef.instance.updateData('clientGuid', clientId);
      }
      
      return true;
    } catch (error) {
      console.error('Error handling client change:', error);
      notify(`Error updating client information: ${error}`, 'error', 3000);
      return false;
    }
  }, [updateClientFields]);

  /**
   * Get current form data
   */
  const getFormData = useCallback((): Project | null => {
    if (!formRef) return null;
    return formRef.instance.option('formData');
  }, [formRef]);

  /**
   * Reset form values to original data
   */
  const resetForm = useCallback(() => {
    if (formRef) {
      formRef.instance.resetValues();
    }
  }, [formRef]);

  return {
    formRef,
    onFormRef,
    updateClientFields,
    handleClientChange,
    getFormData,
    resetForm
  };
};
