import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { confirm } from 'devextreme/ui/dialog';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { v4 as uuidv4 } from 'uuid';
import { getVariationDeliverablesEndpoint } from '../../config/api-endpoints';
import { VariationDeliverableUiStatus } from '../../types/app-types';
import { Deliverable } from '../../types/odata-types';
import { DEFAULT_DELIVERABLE_VALIDATION_RULES } from './useDeliverableCollectionController';
import { 
  getVariationDeliverables,
  addExistingDeliverableToVariation,
  cancelDeliverableVariation,
  removeDeliverableFromVariation,
  addNewDeliverableToVariation
} from '../../adapters/variation-deliverable.adapter';
import { createGridOperationHook } from '../factories/createGridOperationHook';
import { GridOperationsHook, ValidationRule } from '../interfaces/grid-operation-hook.interfaces';
import { useGridUtils } from '../utils/useGridUtils';
import { useProjectInfo } from '../utils/useProjectInfo';
import { useVariationInfo } from '../utils/useVariationInfo';
import { useDeliverableGridEditor, ALWAYS_READONLY_DELIVERABLE_FIELDS } from '../utils/useDeliverableGridEditor';

export interface UseVariationDeliverableCollectionControllerProps {
  token?: string;
  variationGuid: string;
  onError?: (error: any) => void;
  onSuccess?: () => void;
  isReadOnly?: boolean;
  validationRules?: ValidationRule[];
}
export const useVariationDeliverableCollectionController = ({
  token: userToken,
  variationGuid,
  onError,
  onSuccess,
  isReadOnly = false,
  validationRules = DEFAULT_DELIVERABLE_VALIDATION_RULES
}: UseVariationDeliverableCollectionControllerProps) => {
  // ==========================================
  // 1. Core State and Hook Initialization
  // ==========================================
  const collectionHook = createGridOperationHook<Deliverable>({ validationRules }, userToken) as GridOperationsHook<Deliverable>;
  const { setCellValue, handleGridInitialized, cancelEditData } = useGridUtils();
  
  // Create state for deliverables (variation state is now handled by the hook)
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [deliverablesLoading, setDeliverablesLoading] = useState(false);
  const deliverablesRef = useRef<Deliverable[]>(deliverables);
  
  // Use the variation info hook to load and manage variation data
  const { variation, projectGuid, loading: variationLoading, reload: reloadVariation } = useVariationInfo(variationGuid, userToken);
  
  // Create an ArrayStore and DataSource to wrap our deliverables
  const arrayStore = useMemo(() => new ArrayStore({
    data: deliverables,
    key: 'guid'
  }), [deliverables]);

  const deliverableDataSource = useMemo(() => new DataSource({
    store: arrayStore
  }), [arrayStore]);
  
  // Update the data source when deliverables change
  useEffect(() => {
    if (arrayStore && deliverables.length > 0) {
      deliverableDataSource?.reload();
    }
  }, [deliverables, arrayStore, deliverableDataSource]);
  
  // Use state for project data - we'll manage loading with an effect
  const [project, setProject] = useState<any>(null);
  const [projectLoading, setProjectLoading] = useState<boolean>(false);
  
  // Load project info only after variation data is loaded and provides a valid projectGuid
  useEffect(() => {
    const loadProjectInfo = async () => {
      // Only proceed if we have a valid projectGuid from the variation
      if (!projectGuid || !userToken) {
        return;
      }
      
      setProjectLoading(true);
      try {
        // Import the actual API function directly to avoid hook dependency issues
        const { fetchProject } = await import('../../adapters/project.adapter');
        const projectData = await fetchProject(projectGuid, userToken);
        setProject(projectData);
      } catch (error) {
        if (onError) onError(error);
      } finally {
        setProjectLoading(false);
      }
    };
    
    loadProjectInfo();
  }, [projectGuid, userToken, onError]);
  
  // Combined loading state that tracks all data loading operations
  const loading = useMemo(() => {
    return variationLoading || projectLoading || deliverablesLoading;
  }, [variationLoading, projectLoading, deliverablesLoading]);

  // Grid utilities
  const handleGridInit = useCallback((e: any) => {
    handleGridInitialized(e);
  }, [handleGridInitialized]);

  // ==========================================
  // 2. Data Loading and API Endpoints
  // ==========================================
  const getDeliverablesByVariationEndpoint = useCallback(() => {
    return getVariationDeliverablesEndpoint(variationGuid);
  }, [variationGuid]);

  // Variation data is now loaded by the useVariationInfo hook

  const loadDeliverables = useCallback(async () => {
    if (!variationGuid || !userToken) return;
    
    try {
      setDeliverablesLoading(true);
      const items = await getVariationDeliverables(variationGuid, userToken);
      setDeliverables(items);
      deliverablesRef.current = items;
      
      if (!projectGuid) {
        await reloadVariation();
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
    } finally {
      setDeliverablesLoading(false);
    }
  }, [variationGuid, userToken, projectGuid, reloadVariation, onError, onSuccess]);

  const addOrUpdateVariationDeliverable = useCallback(async (
    deliverableGuid: string, 
    variationHours: number, 
    originalDeliverableGuid?: string
  ): Promise<Deliverable> => {
    try {
      const deliverableRow = deliverablesRef.current.find(d => d.guid === deliverableGuid);
      
      if (!deliverableRow) {
        throw new Error(`Deliverable with GUID ${deliverableGuid} not found in current state`);
      }
      
      let guidToUse = deliverableGuid; 
      
      if (originalDeliverableGuid) {
        guidToUse = originalDeliverableGuid;
      } else if (deliverableRow.uiStatus === 'Edit' && deliverableRow.originalDeliverableGuid) {
        guidToUse = deliverableRow.originalDeliverableGuid;
      }
      
      const deliverableEntity: Deliverable = {
        ...deliverableRow, 
        guid: uuidv4(), 
        originalDeliverableGuid: guidToUse, 
        variationGuid: variationGuid, 
        variationHours: variationHours, 
        variationStatus: 'UnapprovedVariation' 
      };
      
      const updatedEntity = await addExistingDeliverableToVariation(deliverableEntity, userToken);
      
      setDeliverables(prevDeliverables => {
        const index = prevDeliverables.findIndex(d => d.guid === deliverableGuid);
        if (index >= 0) {
          const newDeliverables = [...prevDeliverables];
          newDeliverables[index] = updatedEntity;
          return newDeliverables;
        }
        return [...prevDeliverables, updatedEntity];
      });
      
      if (onSuccess) onSuccess();
      
      return updatedEntity;
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  }, [variationGuid, addExistingDeliverableToVariation, onSuccess, onError, setDeliverables]);

  const cancelDeliverable = useCallback(async (deliverableGuid: string, originalDeliverableGuid?: string) => {
    try {
      if (originalDeliverableGuid && originalDeliverableGuid !== deliverableGuid) {
        await removeDeliverableFromVariation(deliverableGuid, originalDeliverableGuid, userToken);
      } else {
        await cancelDeliverableVariation(deliverableGuid, userToken);
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  }, [cancelDeliverableVariation, removeDeliverableFromVariation, loadDeliverables, onSuccess, onError]);



  const confirmCancellation = useCallback(async (deliverable: Deliverable) => {
    let message = '';
    let title = 'Confirm Action';
    
    switch (deliverable.uiStatus) {
      case 'Original':
        message = `Are you sure you want to cancel the deliverable "${deliverable.title}"? This will mark it for cancellation in the variation.`;
        break;
      case 'Add':
        message = `Are you sure you want to remove the deliverable "${deliverable.title}" from the variation?`;
        break;
      case 'Edit':
        message = `Are you sure you want to cancel the deliverable "${deliverable.title}"? This will reset variation units to 0 and mark it for cancellation.`;
        break;
      default:
        return false; 
    }
    
    const result = await confirm(message, title);
    return result;
  }, []);

  const handleCancellationClick = useCallback(async (deliverable: Deliverable) => {
    const confirmed = await confirmCancellation(deliverable);
    if (!confirmed) return;
    
    try {
      switch (deliverable.uiStatus) {
        case 'Original':
          await cancelDeliverable(deliverable.guid, deliverable.guid);
          break;
        case 'Add':
          await cancelDeliverable(deliverable.guid);
          break;
        case 'Edit':
          await cancelDeliverable(deliverable.guid, deliverable.originalDeliverableGuid);
          break;
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
    }
  }, [confirmCancellation, cancelDeliverable]);

  // ==========================================
  // 3. Default Values, Field Validation, and Editor Configuration
  // ==========================================
  const isFieldEditable = useCallback((fieldName: string, uiStatus: VariationDeliverableUiStatus) => {
    // Always readonly fields from shared constant
    if (ALWAYS_READONLY_DELIVERABLE_FIELDS.includes(fieldName)) {
      return false;
    }
    
    // For original deliverables, everything is read-only
    if (uiStatus === 'Original') {
      return false;
    }
    
    // For edited variations, only allow editing variation hours
    if (uiStatus === 'Edit') {
      return fieldName === 'variationHours';
    }
    
    // For new variations, most fields are editable except a few
    if (uiStatus === 'Add') {
      return fieldName !== 'budgetHours';
    }
    
    return false;
  }, []);

  // ==========================================
  // 4. Document Number Generation and Row Initialization
  // ==========================================
  // Use the shared hooks for document number generation, editor configuration, and row initialization
  const { 
    fetchSuggestedDocumentNumber, 
    handleEditorPreparing: baseHandleEditorPreparing,
    getDefaultDeliverableValues: baseGetDefaultValues,
    handleInitNewRow: baseHandleInitNewRow
  } = useDeliverableGridEditor<VariationDeliverableUiStatus>({
    projectGuid,
    userToken,
    isFieldEditable,
    setCellValue,
    onError,
    enableRowInitialization: true,
    project
  });
  
  /**
   * Enhanced version of getDefaultDeliverableValues that adds variation-specific fields
   */
  const getDefaultDeliverableValues = useCallback(() => {
    // Get base default values from the shared hook
    const baseDefaults = baseGetDefaultValues();
    
    // Add variation-specific values
    return {
      ...baseDefaults,
      variationGuid,
      uiStatus: 'Add' as VariationDeliverableUiStatus
    };
  }, [baseGetDefaultValues, variationGuid]);
  
  /**
   * Creates a new deliverable in the variation
   * Uses the default values with proper OData serialization requirements
   */
  const addNewDeliverable = useCallback(async (deliverableData: Partial<Deliverable>) => {
    try {
      // TypeScript safety: ensure projectGuid is a string (not undefined)
      if (!projectGuid) {
        throw new Error('Project GUID is required to create a deliverable');
      }
      
      // Get default values with proper typing - already includes the correct defaults 
      // and variation-specific values like variationGuid and uiStatus
      const defaults = getDefaultDeliverableValues() as Record<string, any>;
      
      // Ensure we always have a new GUID
      const newGuid = uuidv4();
      
      // Build a base deliverable with all required fields as non-nullable
      // This follows our memory about OData serialization requiring complete properties
      const baseDeliverable = {
        guid: newGuid,
        projectGuid,
        variationGuid,
        ...defaults,
        variationHours: deliverableData.variationUnits || deliverableData.variationHours || 0,
        uiStatus: 'Add' as VariationDeliverableUiStatus
      } as Deliverable;
      
      // Apply any remaining custom values from deliverableData
      const newDeliverable: Deliverable = {
        ...baseDeliverable,
        ...deliverableData,
        // Always re-enforce these critical fields
        guid: newGuid,
        projectGuid,
        variationGuid
      };
      
      const createdEntity = await addNewDeliverableToVariation(newDeliverable, userToken);
      
      if (createdEntity) {
        // Update deliverables state with the new entity
        setDeliverables(prev => [...prev, createdEntity]);
        deliverablesRef.current = [...deliverablesRef.current, createdEntity];
      }
      
      if (onSuccess) onSuccess();
      
      return createdEntity;
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  }, [
    // API and handlers
    addNewDeliverableToVariation, 
    userToken, 
    onSuccess, 
    onError,
    
    // Critical data dependencies that were previously missing
    projectGuid,
    variationGuid,
    getDefaultDeliverableValues,
    setDeliverables,
    deliverablesRef
  ]);
  
  /**
   * Enhanced version of handleInitNewRow that adds variation-specific handling
   */
  const handleInitNewRow = useCallback((e: any) => {
    // Call the base initialization function
    baseHandleInitNewRow(e);
    
    // Add variation-specific values
    if (e && e.data) {
      e.data.variationGuid = variationGuid;
      e.data.uiStatus = 'Add';
    }
  }, [baseHandleInitNewRow, variationGuid]);
  
  /**
   * Enhanced version of handleEditorPreparing that adds variation-specific handling
   */
  const handleEditorPreparing = useCallback((e: any) => {
    // Call the base editor preparing function
    baseHandleEditorPreparing(e);
    
    // Add any variation-specific editor customizations here if needed
  }, [baseHandleEditorPreparing]);

  useEffect(() => {
    deliverablesRef.current = deliverables;
  }, [deliverables]);

  // Variation data is automatically loaded by the useVariationInfo hook
  // No need for an explicit effect for loading variation
  
  useEffect(() => {
    if (variationGuid && userToken) {
      loadDeliverables();
    }
  }, [variationGuid, userToken, loadDeliverables]);

  // No need for refs as we're now exposing the actual stores directly
  
  const handleRowInserting = useCallback(async (e: any) => {
    e.cancel = true;
    
    try {
      console.log('Adding new deliverable with data:', e.data);
      
      const newDeliverable = {
        ...getDefaultDeliverableValues(),
        ...e.data,
        variationGuid,
        variationStatus: 'UnapprovedVariation'
      };
      
      // Call our addNewDeliverable function to handle creating it on the server
      const createdEntity = await addNewDeliverable(newDeliverable);
      
      if (createdEntity) {
        // Insert the entity returned from the server directly to the store
        // This ensures all calculated fields are properly populated
        await arrayStore.insert(createdEntity);
        
        // Reload the grid to show the new data with server-calculated fields
        deliverableDataSource.reload();
        
        // Cancel the edit state to close the grid's editing UI
        cancelEditData();
      }
    } catch (error) {
      console.error('Error adding deliverable:', error);
      if (onError) onError(error);
    }
  }, [addNewDeliverable, getDefaultDeliverableValues, variationGuid, onError]);

  const handleRowUpdating = useCallback(async (e: any) => {
    // Extract the data we need from the event
    const { oldData, newData } = e;
    
    try {
      // Only proceed if variationHours has changed
      if (newData.variationHours !== undefined && oldData.variationHours !== newData.variationHours) {
        let originalGuid;
        
        if (oldData.uiStatus === 'Original') {
          // For Original status rows, use the current GUID as the original GUID
          originalGuid = oldData.guid;
        } else if (oldData.uiStatus === 'Edit' && oldData.originalDeliverableGuid) {
          // For Edit status rows that already have an originalDeliverableGuid, use that
          // This ensures we find the correct record in the database
          originalGuid = oldData.originalDeliverableGuid;
        }
        // For all other cases (Add, etc), originalGuid remains undefined
        
        console.log('Updating deliverable with new hours:', newData.variationHours);
        
        // Call our API and get the full updated entity from the server
        const updatedEntity = await addOrUpdateVariationDeliverable(oldData.guid, newData.variationHours, originalGuid);
        
        console.log('Received updated entity from server:', updatedEntity);
        
        // Update the data in the grid row with ALL properties from the server
        // This ensures all calculated fields (booking code, totals, etc.) are correctly shown
        if (updatedEntity) {
          console.log('Applying server response to row');
          Object.assign(e.newData, updatedEntity);
        }
        
        // The controller has already updated our in-memory deliverables array,
        // so we don't need to call loadDeliverables() here
      }
    } catch (error) {
      console.error('Error updating deliverable:', error);
      e.cancel = true;
      if (onError) onError(error);
    }
  }, [addOrUpdateVariationDeliverable, onError]);

  // Return a combined object with both the standard hooks and variation-specific functionality
  return {
    ...collectionHook,
    deliverables,
    loading,
    loadDeliverables,
    reloadVariation, // Use the reload function from useVariationInfo instead
    handleRowUpdating,
    handleRowInserting,
    handleInitNewRow,
    handleCancellationClick,
    handleEditorPreparing,
    getDeliverablesByVariationEndpoint,
    isReadOnly,
    addOrUpdateVariationDeliverable,
    addNewDeliverable,
    getDefaultDeliverableValues,
    fetchSuggestedDocumentNumber,
    setCellValue,
    handleGridInitialized,
    handleGridInit,
    // Expose the data sources for the component
    arrayStore,
    deliverableDataSource,
    // Expose state values
    variation,
    projectGuid,
    project
  };
};
