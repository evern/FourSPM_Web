import React, { createContext, useReducer, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { deliverablesReducer, initialDeliverablesState } from './deliverables-reducer';
import { DeliverablesContextProps, DeliverablesProviderProps, ValidationResult } from './deliverables-types';
import { useProjectData } from '../../hooks/queries/useProjectData';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjectInfo } from '../../hooks/utils/useProjectInfo';
import { getToken } from '../../utils/token-store';
import { Deliverable } from '../../types/odata-types';
import { getSuggestedDocumentNumber } from '../../adapters/deliverable.adapter';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';


export const DEFAULT_DELIVERABLE_VALIDATION_RULES: ValidationRule[] = [
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
  },
  {
    field: 'internalDocumentNumber',
    required: true,
    errorText: 'Document Number is required'
  }
];


const DeliverablesContext = createContext<DeliverablesContextProps | undefined>(undefined);


export function DeliverablesProvider({ children, projectId: projectIdProp }: DeliverablesProviderProps): React.ReactElement {

  const params = useParams<{ projectId: string }>();
  const projectId = projectIdProp || params.projectId;

  const queryClient = useQueryClient();

  const isMountedRef = React.useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const [state, dispatch] = useReducer(deliverablesReducer, initialDeliverablesState);

  const setLoading = useCallback((loading: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;

    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  
  const setLookupDataLoaded = useCallback((loaded: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOOKUP_DATA_LOADED', payload: loaded });
  }, []);


  const processApiError = useCallback((error: any): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred';
  }, []);


  const validateDeliverable = useCallback((deliverable: Partial<Deliverable>, rules: ValidationRule[] = []): ValidationResult => {

    let allRules = [...DEFAULT_DELIVERABLE_VALIDATION_RULES, ...rules];
    
    // Handle project GUID validation differently: if the deliverable doesn't have it but we have a projectId parameter,
    // we'll either skip this validation or inject the projectId as needed
    if (!deliverable.projectGuid && projectId) {
      // For a record being validated before sending to API, we'd want to add the projectId
      // For mere UI validation, we can skip this validation since the projectId will be added later
      // Currently we just skip validation - the handler functions add projectId appropriately
    } else if (!deliverable.projectGuid) {
      // Only add the projectGuid validation if the deliverable doesn't include it and we don't have a project context
      const projectRule: ValidationRule = { field: 'projectGuid', required: true, errorText: 'Project is required' };
      allRules = [projectRule, ...allRules];
    }
    
    // Validate against all rules
    const errors: Record<string, string[]> = {};
    
    allRules.forEach((rule) => {
      const fieldValue = (deliverable as any)[rule.field];
      
      // Required field validation
      if (rule.required && (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === ''))) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} is required`);
      }
      
      // Max length validation for string fields
      if (rule.maxLength && typeof fieldValue === 'string' && fieldValue.length > rule.maxLength) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} must be at most ${rule.maxLength} characters`);
      }
      
      // Pattern validation for regex patterns
      if (rule.pattern && typeof fieldValue === 'string' && !rule.pattern.test(fieldValue)) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} has an invalid format`);
      }
    });
    
    // Return the validation result
    const isValid = Object.keys(errors).length === 0;
    
    // Update validation state in the reducer
    if (isMountedRef.current) {
      if (!isValid) {
        dispatch({ 
          type: 'SET_VALIDATION_ERRORS', 
          payload: errors 
        });
      } else {
        dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
      }
    }
    
    return {
      isValid,
      errors
    };
  }, [dispatch, isMountedRef]);

  /**
   * Initializes a new deliverable with default values
   * @param projectId The project GUID for the deliverable
   * @param project Optional project data for enhanced initialization
   * @param isVariation Whether this is a variation deliverable
   * @returns A new deliverable object with default values
   */
  const initializeDeliverable = useCallback((
    projectId: string,
    project?: any,
    isVariation: boolean = false
  ): Partial<Deliverable> => {
    // Base default values all deliverables should have with proper types
    const defaultValues: Partial<Deliverable> = {
      // Core identifiers
      guid: uuidv4(),
      projectGuid: projectId,
      
      // Required string fields with default values
      departmentId: 'Design',
      deliverableTypeId: 'Deliverable', // Hardcoded default deliverable type
      documentType: '',
      clientDocumentNumber: '',
      discipline: '',
      areaNumber: '',
      documentTitle: '',
      
      // Required numeric fields with default values
      budgetHours: 0,
      variationHours: 0,
      totalHours: 0,
      totalCost: 0
      // Note: created and createdBy are handled by the backend using session data
    };
    
    // Add project-related fields if available
    if (project) {
      // Extract client number if available
      if (project.client) {
        defaultValues.clientNumber = project.client.number || '';
      }
      
      // Extract project number if available
      if (project.projectNumber) {
        defaultValues.projectNumber = project.projectNumber || '';
      }
    }
    
    return defaultValues;
  }, [projectId]); // Adding projectId to satisfy the linter


  const generateDocumentNumber = useCallback(async (
    deliverableTypeId: string | number,
    areaNumber: string, 
    discipline: string, 
    documentType: string,
    currentDeliverableGuid?: string,
    isVariation: boolean = false
  ): Promise<string> => {
    try {

      const deliverableTypeIdStr = deliverableTypeId?.toString() || '';
      

      const token = getToken();
      if (!token) {
        throw new Error('Authentication token is required for document number generation');
      }

      const suggestedNumber = await getSuggestedDocumentNumber(
        projectId,
        deliverableTypeIdStr,
        areaNumber, 
        discipline, 
        documentType,
        token,
        currentDeliverableGuid 
      );
      
      if (isVariation && suggestedNumber) {        return suggestedNumber.replace(/(-\d+)$/, '-XXX');
      }
      
      return suggestedNumber;
    } catch (error) {
      console.error('Error fetching suggested document number:', error);
      const errorMessage = processApiError(error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return '';
    }
  }, [projectId, processApiError, dispatch]);


  const { 
    areasDataSource, 
    disciplinesDataSource, 
    documentTypesDataSource,
    isLoading: referenceDataLoading, 
    error: referenceDataError 
  } = useProjectData(projectId);
  

  const {
    project,
    isLoading: projectLoading,
    error: projectError
  } = useProjectInfo(projectId, { expandClient: true });
  

  const invalidateAllLookups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deliverables'] });
    queryClient.invalidateQueries({ queryKey: ['lookup'] });
    queryClient.invalidateQueries({ queryKey: ['project'] });
  }, [queryClient]);
  
  const isLookupDataLoading = referenceDataLoading || projectLoading;
  

  useEffect(() => {
    if (isMountedRef.current) {
      setLookupDataLoaded(!isLookupDataLoading);
    }
  }, [isLookupDataLoading, setLookupDataLoaded]);
  
  const contextValue = useMemo(() => ({
    state,
    validateDeliverable,
    initializeDeliverable,
    generateDocumentNumber,
    setLoading,
    setError,
    setLookupDataLoaded,
    invalidateAllLookups,
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    project: project || undefined
  }), [
    state, 
    validateDeliverable,
    initializeDeliverable,
    generateDocumentNumber,
    setLoading,
    setError,
    setLookupDataLoaded,
    invalidateAllLookups,
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLookupDataLoading,
    project
  ]);
  
  return (
    <DeliverablesContext.Provider value={contextValue}>
      {children}
    </DeliverablesContext.Provider>
  );
}


export function useDeliverables(): DeliverablesContextProps {
  const context = useContext(DeliverablesContext);
  
  if (!context) {
    throw new Error('useDeliverables must be used within a DeliverablesProvider');
  }
  
  return context;
}
