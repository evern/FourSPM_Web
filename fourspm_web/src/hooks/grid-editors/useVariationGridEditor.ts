import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Variation } from '../../types/odata-types';

/**
 * Interface for the variation grid editor properties
 */
export interface UseVariationGridEditorProps<TStatus = string> {
  projectGuid: string;
  userToken?: string;
  isFieldEditable?: (fieldName: string, uiStatus: TStatus) => boolean;
  setCellValue?: (rowIndex: number, dataField: string, value: any) => void;
  onError?: (error: any) => void;
  /**
   * Whether to enable row initialization logic (setting projectGuid, generating guid)
   * Default is true
   */
  enableRowInitialization?: boolean;
  /**
   * Optional project data for enhanced row initialization
   */
  project?: any;
}

/**
 * Hook for handling editor preparation and field customization for variation fields
 */
export const useVariationGridEditor = <TStatus = string>({
  projectGuid,
  userToken,
  isFieldEditable,
  setCellValue,
  onError,
  enableRowInitialization = true,
  project
}: UseVariationGridEditorProps<TStatus>) => {
  /**
   * Gets default values for a new variation based on the current context
   * Creates a properly typed base object with all required non-nullable fields
   */
  const getDefaultVariationValues = useCallback(() => {
    // Base default values all variations should have with proper types
    const defaultValues: Partial<Variation> = {
      // Core identifiers
      guid: uuidv4(),
      projectGuid,
      
      // Required string fields with default values
      name: '',
      comments: '',
      
      // Set created date to now
      created: new Date()
    };
    
    return defaultValues;
  }, [projectGuid]);

  /**
   * Shared handler for initializing a new row with default values
   */
  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data && enableRowInitialization) {
      // Apply default values first
      const defaultValues = getDefaultVariationValues();
      Object.assign(e.data, defaultValues);
      
      // Add project-related fields if available
      if (project) {
        // You could add additional project-related defaults here if needed
        // For example:
        // e.data.projectNumber = project.projectNumber || '';
      }
    }
  }, [getDefaultVariationValues, enableRowInitialization, project]);

  /**
   * Handler for editor preparing event
   * Customizes editors based on field, row state, and application status
   */
  const handleEditorPreparing = useCallback((e: any) => {
    const { dataField, editorOptions, row } = e;
    
    // Skip if no options to customize
    if (!editorOptions) return;
    
    // Get original onValueChanged if it exists
    const originalSetValue = editorOptions.onValueChanged;
    
    // Make sure field is actually editable - use provided function or default to always editable
    const canEdit = isFieldEditable ? isFieldEditable(dataField, row?.data?.status) : true;
    if (!canEdit) {
      editorOptions.disabled = true;
      return;
    }
    
    // Custom field-specific editor configurations
    switch (dataField) {
      case 'comments':
        // Make comments field taller
        editorOptions.height = 80;
        break;
        
      case 'submitted':
      case 'clientApproved':
        // Format date fields
        e.editorName = 'dxDateBox';
        editorOptions.displayFormat = 'yyyy-MM-dd';
        break;
        
      case 'name':
        // Set max length for name field
        editorOptions.maxLength = 100;
        break;
    }
  }, [isFieldEditable]);

  return {
    // Editor configuration function
    handleEditorPreparing,
    
    // Row initialization functions
    getDefaultVariationValues,
    handleInitNewRow
  };
};
