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
  resetValues: (originalData?: any) => void;
  handleLookupChange: (fieldName: string, value: any) => Promise<boolean>;
}

/**
 * Configuration options for form operations
 */
export interface FormOperationsConfig<T = any> {
  onValidationError?: () => void;
  onSaveSuccess?: (result: any) => void;
  onSaveError?: (error: any) => void;
  onStartEditing?: () => void;
  onCancelEditing?: (originalData?: any) => void;
  
  // Enhanced lookup fields configuration
  lookupFields?: Array<{
    // The field name in the entity that contains the lookup ID (e.g., 'clientGuid')
    idField: keyof T;
    // The related object field (e.g., 'client')
    objectField: keyof T;
    // Optional array of related fields that should be updated when this lookup changes
    // For example, when client changes, we might want to update client.contactName, etc.
    relatedFields?: string[];
    // Optional callback to load related data when selection changes
    // This allows for custom async data loading when a lookup value is selected
    loadRelatedData?: (id: string) => Promise<any>;
  }>;
  // The entity data reference for direct updates
  entityData?: T | null;
}

/**
 * Factory function to create a form operations hook
 * @param config Configuration options for the form operations
 * @returns Form operations hook with methods for manipulating form state and data
 */
export function createFormOperationHook<T>(
  config?: FormOperationsConfig<T>
): FormOperationsHook<T> {
  // State for form reference and editing status
  const [formRef, setFormRefState] = useState<Form | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<T | null>(null);
  
  /**
   * Set the form reference for accessing form data and methods
   */
  const setFormRef = useCallback((ref: Form | null) => {
    setFormRefState(ref);
  }, []);
  
  /**
   * Reset form values to original data
   * @param originalData Optional original entity data to restore
   * When provided, this will replace the entire form data instead of just resetting values,
   * which helps properly handle complex fields with async data sources
   */
  const resetValues = useCallback((originalData?: any) => {
    if (formRef?.instance) {
      if (originalData) {
        // When we have original data, use option('formData') directly instead of resetValues
        // This approach avoids the flickering effect caused by calling both methods
        formRef.instance.option('formData', {...originalData});
      } else {
        // Fall back to resetValues if no original data is provided
        formRef.instance.resetValues();
      }
    }
  }, [formRef]);
  
  /**
   * Start editing mode
   */
  const startEditing = useCallback(() => {
    setIsEditing(true);
    
    // Store the original data for proper reset later
    if (formRef?.instance) {
      const currentData = formRef.instance.option('formData');
      setOriginalData(currentData ? {...currentData} : null);
    }
    
    if (config?.onStartEditing) {
      config.onStartEditing();
    }
  }, [formRef, config]);
  
  /**
   * Cancel editing and reset form values
   */
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    
    // Use the enhanced resetValues with original data
    if (formRef?.instance && originalData) {
      // When we have original data, reset form and trigger a clean update with original data
      resetValues(originalData);
      
      // Handle lookup fields if specified and entity data is available
      if (config?.lookupFields && config.lookupFields.length > 0 && config.entityData) {
        // Standard handling for lookup fields
        config.lookupFields.forEach(lookup => {
          const idFieldName = String(lookup.idField);
          const objectFieldName = String(lookup.objectField);
          
          // Only update if the original data contains these fields
          // Use type-safe approach with Object.prototype.hasOwnProperty
          if (
            Object.prototype.hasOwnProperty.call(originalData, idFieldName) && 
            Object.prototype.hasOwnProperty.call(originalData, objectFieldName)
          ) {
            // Direct update of entity data to prevent flickering
            if (config.entityData) {
              // Type-safe property access
              const originalIdValue = (originalData as any)[idFieldName];
              const originalObjectValue = (originalData as any)[objectFieldName];
              
              (config.entityData as any)[idFieldName] = originalIdValue;
              (config.entityData as any)[objectFieldName] = originalObjectValue;
            }
          }
        });
      }
      
      // Call the custom cancel handler with original data
      if (config?.onCancelEditing) {
        config.onCancelEditing(originalData);
      }
    } else {
      // Fallback if no original data
      if (formRef?.instance) {
        resetValues();
      }
      
      if (config?.onCancelEditing) {
        config.onCancelEditing();
      }
    }
  }, [formRef, resetValues, originalData, config]);
  
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
   * Handle lookup field selection change
   * @param fieldName Name of the lookup field that changed
   * @param value New value for the field (can be null when cleared)
   * @returns Promise that resolves when all updates are complete
   */
  const handleLookupChange = useCallback(async (fieldName: string, value: any): Promise<boolean> => {
    if (!formRef?.instance) return false;
    
    // Find the lookup field configuration that matches this field
    const lookup = config?.lookupFields?.find(l => String(l.idField) === fieldName);
    if (!lookup) return false;
    
    const idFieldName = String(lookup.idField);
    const objectFieldName = String(lookup.objectField);
    
    try {
      if (value) {
        // Case 1: Value is selected - load and update related data
        if (lookup.loadRelatedData) {
          // Load related data using the provided callback
          const relatedData = await lookup.loadRelatedData(value);
          
          if (relatedData) {
            // Update the form with the related data
            updateField(idFieldName, value);
            updateField(objectFieldName, relatedData);
            
            // Update any additional related fields
            if (lookup.relatedFields && lookup.relatedFields.length > 0) {
              const relatedFields = lookup.relatedFields; // declare relatedFields here
              relatedFields.forEach(relatedField => {
                const fieldPath = `${objectFieldName}.${relatedField}`;
                const fieldValue = relatedData[relatedField];
                updateField(fieldPath, fieldValue);
              });
            }
            
            // Update entity data directly if available
            if (config?.entityData) {
              (config.entityData as any)[idFieldName] = value;
              (config.entityData as any)[objectFieldName] = relatedData;
            }
            
            return true;
          }
        } else {
          // Just update the ID field if no loader is provided
          updateField(idFieldName, value);
          
          // Update entity data if available
          if (config?.entityData) {
            (config.entityData as any)[idFieldName] = value;
          }
          
          return true;
        }
      } else {
        // Case 2: Value is cleared (null) - reset all related fields
        // Update form fields
        updateField(idFieldName, null);
        
        // Clear related object field if it exists
        if (objectFieldName) {
          updateField(objectFieldName, null);
          
          // Clear any related fields
          if (lookup.relatedFields && lookup.relatedFields.length > 0) {
            const relatedFields = lookup.relatedFields; // declare relatedFields here
            relatedFields.forEach(relatedField => {
              const fieldPath = `${objectFieldName}.${relatedField}`;
              updateField(fieldPath, null);
            });
          }
        }
        
        // Update entity data directly if available
        if (config?.entityData) {
          (config.entityData as any)[idFieldName] = null;
          if (objectFieldName) {
            (config.entityData as any)[objectFieldName] = null;
          }
        }
        
        return true;
      }
    } catch (error) {
      console.error(`Error handling lookup change for ${fieldName}:`, error);
      return false;
    }
    
    return false;
  }, [formRef, updateField, config]);
  
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
    resetValues,
    handleLookupChange
  };
}
