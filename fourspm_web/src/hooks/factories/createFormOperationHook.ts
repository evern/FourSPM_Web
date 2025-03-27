/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useCallback } from 'react';
import { Form } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';

/**
 * Interface for form operations hook
 */
export interface FormOperationsHook<T> {
  formRef: Form | null;
  setFormRef: (ref: Form | null) => void;
  isEditing: boolean;
  isSaving: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  validateForm: () => boolean;
  getFormData: () => T | null;
  saveForm: (entityId: string, saveFunction: (id: string, data: T) => Promise<T | null>) => Promise<T | null>;
  
  // Additional methods for direct form field manipulation (to prevent flickering)
  updateField: (fieldName: string, value: any) => void;
  updateFields: (fields: Record<string, any>) => void;
  resetValues: () => void;
}

/**
 * Configuration options for form operations
 */
export interface FormOperationsConfig {
  onValidationError?: () => void;
  onSaveSuccess?: (result: any) => void;
  onSaveError?: (error: any) => void;
}

/**
 * Factory function to create a form operations hook
 * @param config Configuration options for the form operations
 * @returns Form operations hook with methods for manipulating form state and data
 */
export function createFormOperationHook<T>(
  config?: FormOperationsConfig
): FormOperationsHook<T> {
  // State for form reference and editing status
  const [formRef, setFormRefState] = useState<Form | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  /**
   * Set the form reference for accessing form data and methods
   */
  const setFormRef = useCallback((ref: Form | null) => {
    setFormRefState(ref);
  }, []);
  
  /**
   * Start editing mode
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  /**
   * Cancel editing and reset form values
   */
  const cancelEditing = useCallback(() => {
    // First exit edit mode
    setIsEditing(false);
    
    // Reset form values to their original state
    if (formRef && formRef.instance) {
      formRef.instance.resetValues();
    }
  }, [formRef]);

  /**
   * Validate the form
   * @returns True if valid, false otherwise
   */
  const validateForm = useCallback((): boolean => {
    if (!formRef || !formRef.instance) return true;
    
    const validationResult = formRef.instance.validate();
    if (!validationResult.isValid) {
      notify('Please correct the validation errors', 'error', 3000);
      if (config?.onValidationError) {
        config.onValidationError();
      }
      return false;
    }
    
    return true;
  }, [formRef, config]);
  
  /**
   * Get current form data
   * @returns Form data or null if not available
   */
  const getFormData = useCallback((): T | null => {
    if (!formRef || !formRef.instance) return null;
    return formRef.instance.option('formData');
  }, [formRef]);
  
  /**
   * Save form data using the provided save function
   * @param entityId ID of the entity to save
   * @param saveFunction Function to call to save the data
   * @returns Saved entity or null if failed
   */
  const saveForm = useCallback(async (
    entityId: string,
    saveFunction: (id: string, data: T) => Promise<T | null>
  ): Promise<T | null> => {
    if (!validateForm()) return null;
    
    const formData = getFormData();
    if (!formData) return null;
    
    setIsSaving(true);
    try {
      // Update UI immediately to prevent flickering
      setIsEditing(false);
      
      // Call API to save data
      const result = await saveFunction(entityId, formData);
      
      if (result) {
        notify('Data saved successfully', 'success', 3000);
        
        // Update form data quietly without causing re-render
        if (formRef?.instance) {
          formRef.instance.option('formData', result);
        }
        
        if (config?.onSaveSuccess) {
          config.onSaveSuccess(result);
        }
        
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error saving data:', error);
      notify(`Error saving data: ${error}`, 'error', 3000);
      
      // Revert to edit mode on error
      setIsEditing(true);
      
      if (config?.onSaveError) {
        config.onSaveError(error);
      }
      
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, getFormData, formRef, config]);
  
  /**
   * Update a single field in the form directly (without causing re-renders)
   * @param fieldName Name of the field to update
   * @param value New value for the field
   */
  const updateField = useCallback((fieldName: string, value: any) => {
    if (formRef?.instance) {
      formRef.instance.updateData(fieldName, value);
    }
  }, [formRef]);
  
  /**
   * Update multiple fields in the form directly
   * @param fields Record of field names and values to update
   */
  const updateFields = useCallback((fields: Record<string, any>) => {
    if (!formRef?.instance) return;
    
    Object.entries(fields).forEach(([fieldName, value]) => {
      formRef.instance.updateData(fieldName, value);
    });
  }, [formRef]);
  
  /**
   * Reset form values to original data
   */
  const resetValues = useCallback(() => {
    if (formRef?.instance) {
      formRef.instance.resetValues();
    }
  }, [formRef]);
  
  return {
    formRef,
    setFormRef,
    isEditing,
    isSaving,
    startEditing,
    cancelEditing,
    validateForm,
    getFormData,
    saveForm,
    updateField,
    updateFields,
    resetValues
  };
}
