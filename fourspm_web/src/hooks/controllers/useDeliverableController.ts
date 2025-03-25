import { useCallback, useState, useEffect } from 'react';
import { createCollectionHook } from '../factories/createCollectionHook';
import { createEntityHook } from '../factories/createEntityHook';
import { GridEnabledCollectionHook, ValidationRule, ProjectControllerBase, GridOperationsConfig } from '../interfaces/collection-hook.interfaces';
import { EntityHook } from '../interfaces/entity-hook.interfaces';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { fetchProject } from '../../adapters/project.adapter';
import { Project } from '../../types/index'; // Import ProjectInfo
import { baseApiService } from '../../api/base-api.service'; // Import the baseApiService
import { Deliverable } from '../../types/odata-types';

/**
 * Default validation rules for deliverables
 */
const DEFAULT_DELIVERABLE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'areaNumber', 
    required: true, 
    maxLength: 2,
    pattern: /^[0-9][0-9]$/,
    errorText: 'Area Number must be exactly 2 digits (00-99)' 
  },
  { 
    field: 'discipline', 
    required: true,
    errorText: 'Discipline is required' 
  },
  { 
    field: 'documentType', 
    required: true,
    errorText: 'Document Type is required' 
  },
  { 
    field: 'deliverableTypeId', 
    required: true, 
    errorText: 'Deliverable Type is required'
  },
  { 
    field: 'documentTitle', 
    required: true, 
    maxLength: 500,
    errorText: 'Document Title is required and must be at most 500 characters' 
  }
];

/**
 * Base interface for Deliverable data hook - combines collection and entity hooks with deliverable-specific functionality
 */
export interface DeliverableControllerHook extends GridEnabledCollectionHook<Deliverable>, EntityHook<Deliverable> {
  fetchSuggestedDocumentNumber: (
    deliverableTypeId: string,
    areaNumber: string, 
    discipline: string, 
    documentType: string
  ) => Promise<string>;
}

/**
 * Project-specific deliverable controller interface with additional document handling functionality
 */
export interface ProjectDeliverableControllerHook extends DeliverableControllerHook, ProjectControllerBase<Deliverable> {
  handleEditorPreparing: (e: any) => void;
  project: Project | null; // Update projectInfo type
  isProjectLoading: boolean;
  projectId: string;
}

// Helper function to fetch deliverables with consistent error handling
const getDeliverables = async (token: string, projectId?: string): Promise<Deliverable[]> => {
  try {
    let endpoint = `${API_CONFIG.baseUrl}/odata/v1/Deliverables`;
    
    // Add filter for specific project if provided
    if (projectId) {
      endpoint += `?$filter=projectGuid eq '${projectId}'`;
    }
    
    // Use baseApiService for consistent API handling
    const response = await baseApiService.request(endpoint, {
      method: 'GET'
    });
    
    const data = await response.json();
    return data.value || [];
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    throw error;
  }
};

/**
 * Hook to manage deliverable data operations without project-specific functionality
 * @param userToken The user's authentication token
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @param projectId Optional project ID to filter deliverables
 * @returns Object containing deliverable data state and handler functions
 */
export function useDeliverableController(
  userToken: string | undefined,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DELIVERABLE_VALIDATION_RULES,
  projectId?: string
): DeliverableControllerHook {
  /**
   * Function to fetch a suggested internal document number from the server
   */
  const fetchSuggestedDocumentNumber = useCallback(async (
    deliverableTypeId: string,
    areaNumber: string, 
    discipline: string, 
    documentType: string
  ): Promise<string> => {
    try {
      // If no project ID is available, return empty string
      if (!projectId) {
        console.error('Error fetching document number: No project ID available in hook');
        return '';
      }
      
      const url = `${API_CONFIG.baseUrl}/odata/v1/Deliverables/SuggestInternalDocumentNumber` +
                 `?projectGuid=${encodeURIComponent(projectId)}` +
                 `&deliverableTypeId=${encodeURIComponent(deliverableTypeId)}` +
                 `&areaNumber=${encodeURIComponent(areaNumber)}` +
                 `&discipline=${encodeURIComponent(discipline)}` +
                 `&documentType=${encodeURIComponent(documentType)}`;
      
      // Use the baseApiService which already handles token management
      const response = await baseApiService.request(url, {
        method: 'GET'
      });
      
      const data = await response.json();
      return data.suggestedNumber || '';
    } catch (error) {
      console.error('Error fetching document number:', error);
      return '';
    }
  }, [projectId]); // Keep projectId in the dependencies array

  // Create collection hook for deliverable grid operations
  const collectionHook = createCollectionHook<Deliverable>({
    services: {
      getAll: (options, token) => {
        if (!token) throw new Error('Token is required');
        // Get projectId from options, explicit parameter, or filter
        const effectiveProjectId = options?.projectId || projectId || options?.filter?.projectGuid;
        return getDeliverables(token, effectiveProjectId);
      }
    },
    callbacks: {
      onError: (error, operation) => {
        console.error(`Error in Deliverable operation (${operation}):`, error);
      },
      // Spread all grid operation callbacks directly
      ...gridConfig
    },
    validationRules // Pass validation rules to the collection hook
  }, userToken, true) as GridEnabledCollectionHook<Deliverable>;
  
  // Create entity hook for a single deliverable
  const entityHook = createEntityHook<Deliverable>({
    services: {
      // We don't need specific entity services at this point
    },
    callbacks: {
      // Handle any entity-specific callbacks here
      onError: (error, operation) => {
        console.error(`Error in Deliverable entity operation (${operation}):`, error);
      }
    }
  }, userToken);
  
  // Return the combined hooks with all required functionality
  return {
    ...collectionHook,
    ...entityHook,
    fetchSuggestedDocumentNumber
  };
}

/**
 * Project-specific hook to manage deliverable data operations with project context
 * @param userToken The user's authentication token
 * @param projectId Project ID to enable project-specific functionality
 * @param gridConfig Optional configuration for grid operations and callbacks
 * @param validationRules Optional validation rules (uses defaults if not provided)
 * @returns Object containing deliverable data with project context
 */
export function useDeliverableControllerWithProject(
  userToken: string | undefined,
  projectId: string,
  gridConfig?: GridOperationsConfig,
  validationRules: ValidationRule[] = DEFAULT_DELIVERABLE_VALIDATION_RULES
): ProjectDeliverableControllerHook {
  // Create base deliverable hook
  const baseHook = useDeliverableController(userToken, {
    ...gridConfig,
    endpoint: `${API_CONFIG.baseUrl}/odata/v1/Deliverables?$filter=projectGuid eq '${projectId}'`
  }, validationRules, projectId);
  
  // Extract the fetchSuggestedDocumentNumber function from baseHook
  const { fetchSuggestedDocumentNumber } = baseHook;
  
  // Local state for project-specific data
  const [project, setProject] = useState<Project | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [gridInstance, setGridInstance] = useState<any>(null);
  
  // Load project information on mount
  useEffect(() => {
    if (!userToken || !projectId) return;
    
    const loadProjectInfo = async () => {
      setIsProjectLoading(true);
      try {
        const projectData = await fetchProject(projectId, userToken);
        setProject(projectData);
      } catch (error) {
        console.error('Error loading project info:', error);
      } finally {
        setIsProjectLoading(false);
      }
    };
    
    loadProjectInfo();
  }, [projectId, userToken]);
  
  /**
   * Initialize new row with default values
   */
  const handleInitNewRow = useCallback((e: any) => {
    e.data = {
      guid: uuidv4(),
      projectGuid: projectId,
      areaNumber: '',
      discipline: '',
      documentType: '',
      departmentId: 'Administration', // Required for document number generation
      deliverableTypeId: 'Task',
      documentTitle: '',
      budgetHours: 0, // Zero values for numeric fields
      variationHours: 0 // Zero values for numeric fields
    };
  }, [projectId]);
  
  /**
   * Handler for editor preparing event - adds custom behaviors to the form fields
   */
  const handleEditorPreparing = useCallback((e: any) => {
    // Save the original setValue function to call it later
    const originalSetValue = e.editorOptions?.onValueChanged;
    const { dataField, row, editorOptions } = e;
    
    // Set the initial value for new rows or apply conditional logic
    if (dataField && row?.isNewRow) {
      // For new rows, pre-populate data from project
      if (dataField === 'projectGuid' && projectId) {
        editorOptions.value = projectId;
        editorOptions.disabled = true;
      }
      
      // Auto-generate GUID for new rows
      if (dataField === 'guid') {
        editorOptions.value = uuidv4();
      }
    }
    
    // Setup field change watchers for fields that affect document numbering
    if (['areaNumber', 'discipline', 'documentType', 'deliverableTypeId'].includes(dataField)) {
      editorOptions.onValueChanged = async (args: any) => {
        // Call the original handler first
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // Get current values from the row data
        const rowData = row.data;
        const deliverableTypeId = dataField === 'deliverableTypeId' ? args.value : rowData.deliverableTypeId;
        const areaNumber = dataField === 'areaNumber' ? args.value : rowData.areaNumber;
        const discipline = dataField === 'discipline' ? args.value : rowData.discipline;
        const documentType = dataField === 'documentType' ? args.value : rowData.documentType;
        
        // Only attempt to generate a document number if we have enough required fields
        // Using numeric enum values from the backend (3 = Deliverable)
        const shouldGenerateNumber = 
          deliverableTypeId !== undefined && 
          ((deliverableTypeId === 3 && areaNumber) || deliverableTypeId !== 3) &&
          (discipline || documentType)
        ;
        
        if (shouldGenerateNumber) {
          // Use the hook's fetchSuggestedDocumentNumber method
          const suggestedNumber = await fetchSuggestedDocumentNumber(
            deliverableTypeId.toString(), 
            areaNumber, 
            discipline, 
            documentType
          );
          
          if (suggestedNumber && gridInstance) {
            // Find the cell for internal document number and update it
            gridInstance.cellValue(row.rowIndex, 'internalDocumentNumber', suggestedNumber);
          }
        }
      };
      return;
    }
    
    // Handle special fields that need custom behavior
    if (dataField === 'deliverableTypeId') {
      // Override onValueChanged to update other fields when deliverable type changes
      editorOptions.onValueChanged = (args: any) => {
        // Call the original setValue function if it exists
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // If this is a Deliverable, task or regular ICR document, handle it differently
        // Note that we're now using number enum values: 0: Task, 1: NonDeliverable, 2: DeliverableICR, 3: Deliverable
        const isDeliverableOrICR = args.value === 2 || args.value === 3;
        
        // Get the form instance
        const form = e.component;
        
        // Make certain fields required based on deliverable type
        const editors = form.getEditor('areaNumber');
        if (editors) {
          editors.option('disabled', !isDeliverableOrICR);
        }
      };
    }
    
    // Read-only fields handled on grid column definition level
    // All calculated fields are now handled by the server
  }, [projectId, fetchSuggestedDocumentNumber, gridInstance]);
  
  /**
   * Save grid instance for later use
   */
  const handleGridInitialized = useCallback((e: any) => {
    setGridInstance(e.component);
  }, []);
  
  // Return the enhanced hook with project context
  return {
    ...baseHook,
    project,
    isProjectLoading,
    projectId,
    handleEditorPreparing,
    handleInitNewRow,
    handleGridInitialized,
    gridInstance,
    setGridInstance
  };
}
