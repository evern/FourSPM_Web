import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { confirm } from 'devextreme/ui/dialog';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { v4 as uuidv4 } from 'uuid';
import { DELIVERABLES_ENDPOINT, getVariationDeliverablesEndpoint } from '../../config/api-endpoints';
import { cancelDeliverable as cancelDeliverableAdapter, getSuggestedDocumentNumber } from '../../adapters/deliverable.adapter';
import { getVariationById } from '../../adapters/variation.adapter';
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
import { useDeliverableDocumentNumber } from '../utils/useDeliverableDocumentNumber';

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
  
  // State management
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(false);
  const deliverablesRef = useRef<Deliverable[]>(deliverables);
  const [variation, setVariation] = useState<any>(null);
  const [projectGuid, setProjectGuid] = useState<string>('');
  
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
  
  // Fetch project information when projectGuid is available
  const { project } = useProjectInfo(projectGuid, userToken);

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

  const loadVariationData = useCallback(async () => {
    if (!variationGuid || !userToken) return;
    
    try {
      const variationData = await getVariationById(variationGuid, userToken);
      setVariation(variationData);
      setProjectGuid(variationData.projectGuid);
    } catch (error) {
      if (onError) onError(error);
    }
  }, [variationGuid, userToken, onError]);

  const loadDeliverables = useCallback(async () => {
    if (!variationGuid || !userToken) return;
    
    try {
      setLoading(true);
      const items = await getVariationDeliverables(variationGuid, userToken);
      setDeliverables(items);
      deliverablesRef.current = items;
      
      if (!projectGuid) {
        await loadVariationData();
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }, [variationGuid, userToken, projectGuid, loadVariationData, onError, onSuccess]);

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

  const addNewDeliverable = useCallback(async (deliverableData: Partial<Deliverable>) => {
    try {
      const newDeliverable: Deliverable = {
        ...getDefaultDeliverableValues(),
        ...deliverableData,
        variationHours: deliverableData.variationUnits || deliverableData.variationHours || 0
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
  }, [addNewDeliverableToVariation, userToken, onSuccess, onError]);

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
  // 3. Default Values and Field Validation
  // ==========================================
  const getDefaultDeliverableValues = useCallback(() => ({
    guid: uuidv4(),
    variationGuid,
    projectGuid,
    departmentId: 'Administration',
    deliverableTypeId: 'Task',
    uiStatus: 'Add' as VariationDeliverableUiStatus
  }), [variationGuid, projectGuid]);

  const handleInitNewRow = useCallback((e: any) => {
    if (e && e.data) {
      // Apply default values first
      Object.assign(e.data, getDefaultDeliverableValues());
      
      // Add project-related fields if available
      if (project) {
        if (project.client) {
          e.data.clientNumber = project.client.number || '';
        }
        
        if (project.projectNumber) {
          e.data.projectNumber = project.projectNumber || '';
        }
      } else {
        console.warn('Project data not available when initializing new deliverable');
      }
    }
  }, [getDefaultDeliverableValues, project]);

  const isFieldEditable = useCallback((fieldName: string, uiStatus: VariationDeliverableUiStatus) => {
    // These fields are calculated by the backend and should always be read-only
    const alwaysReadOnly = [
      'bookingCode', 
      'internalDocumentNumber', 
      'clientNumber', 
      'projectNumber', 
      'totalHours'
    ];
    
    if (alwaysReadOnly.includes(fieldName)) {
      return false;
    }
    
    if (uiStatus === 'Original' || uiStatus === 'Edit') {
      return fieldName === 'variationHours';
    }
    
    if (uiStatus === 'Add') {
      return fieldName !== 'budgetHours';
    }
    
    return false;
  }, []);

  // ==========================================
  // 4. Document Number Generation
  // ==========================================
  // Use the shared hook for document number generation
  const { fetchSuggestedDocumentNumber, handleEditorPreparing } = useDeliverableDocumentNumber<VariationDeliverableUiStatus>({
    projectGuid,
    userToken,
    isFieldEditable,
    setCellValue,
    onError
  });

  useEffect(() => {
    deliverablesRef.current = deliverables;
  }, [deliverables]);

  useEffect(() => {
    loadVariationData();
  }, [loadVariationData]);
  
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
    deliverableDataSource
  };
};
