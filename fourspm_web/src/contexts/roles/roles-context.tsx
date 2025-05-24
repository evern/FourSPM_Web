import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { RolesContextType, RolesProviderProps, ValidationResult, Role, EditorEvent, InitNewRowEvent } from './roles-types';
import { rolesReducer, initialRolesState } from './roles-reducer';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { useQueryClient } from '@tanstack/react-query';
import { useEntityValidator } from '../../hooks/utils/useEntityValidator';

/**
 * Default validation rules for roles
 */
export const DEFAULT_ROLE_VALIDATION_RULES: ValidationRule[] = [
  { 
    field: 'name', 
    required: true, 
    maxLength: 100, 
    errorText: 'Name is required and must be less than 100 characters' 
  },
  { 
    field: 'displayName', 
    required: true, 
    maxLength: 100, 
    errorText: 'Display Name is required and must be less than 100 characters' 
  },
  { 
    field: 'description', 
    required: false, 
    maxLength: 500, 
    errorText: 'Description must be less than 500 characters' 
  }
];

// Create the context with a default undefined value
const RolesContext = createContext<RolesContextType | undefined>(undefined);

export function RolesProvider({ children }: RolesProviderProps) {
  const [state, dispatch] = useReducer(rolesReducer, initialRolesState);
  
  // Set up the entity validator with role-specific rules
  const {
    handleRowValidating: validatorHandleRowValidating,
    validateEntity,
    validateRowUpdate
  } = useEntityValidator({
    validationRules: DEFAULT_ROLE_VALIDATION_RULES
  });
  
  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // CRITICAL: Track the component mount state to prevent state updates after unmounting
  const isMountedRef = React.useRef(true);
  
  useEffect(() => {
    // Set mounted flag to true when component mounts
    isMountedRef.current = true;
    
    // Clean up function to prevent state updates after unmounting
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Action creators for state management
  const setLoading = useCallback((loading: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Cache invalidation function
  const invalidateAllLookups = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Invalidate roles queries - this will force a refresh of any components
    // that depend on roles data
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  }, [queryClient]);
  
  // Validation for roles
  const validateRole = useCallback((role: Record<string, any>): ValidationResult => {
    if (!isMountedRef.current) return { isValid: false, errors: {} };
    
    // validateEntity only takes one argument - the entity validator was initialized with the rules
    const validationResult = validateEntity(role);
    return validationResult;
  }, [validateEntity]);
  
  // Grid validation handlers
  const handleRowValidating = useCallback((e: any) => {
    if (!isMountedRef.current) return;
    
    // Use the validator from useEntityValidator
    validatorHandleRowValidating(e);
    
    // If validation failed, set the editor error
    if (!e.isValid && e.errorText) {
      dispatch({ type: 'SET_EDITOR_ERROR', payload: e.errorText });
    } else {
      dispatch({ type: 'SET_EDITOR_ERROR', payload: null });
    }
  }, [validatorHandleRowValidating]);
  
  const validateRowUpdating = useCallback((oldData: Record<string, any>, newData: Record<string, any>): ValidationResult => {
    if (!isMountedRef.current) return { isValid: false, errors: {} };
    
    return validateRowUpdate(oldData, newData);
  }, [validateRowUpdate]);
  
  // Default values for new roles
  const getDefaultRoleValues = useCallback((): Partial<Role> => {
    return {
      guid: uuidv4(),
      name: '',
      displayName: '',
      description: '',
      isSystemRole: false
    };
  }, []);
  
  // Editor event handlers
  const handleRoleEditorPreparing = useCallback((e: EditorEvent) => {
    // For this example, we don't need any special editor preparation
    // This is where you would handle any special editor configurations
  }, []);
  
  const handleRoleInitNewRow = useCallback((e: InitNewRowEvent) => {
    // Set default values for new roles
    e.data = getDefaultRoleValues();
  }, [getDefaultRoleValues]);
  
  // Create context value with all functions and state
  const contextValue = useMemo(() => ({
    // State management
    state,
    setLoading,
    setError,
    
    // Validation methods
    validateRole,
    handleRowValidating,
    validateRowUpdating,
    
    // Editor functions
    getDefaultRoleValues,
    handleRoleEditorPreparing,
    handleRoleInitNewRow,
    
    // Cache invalidation function
    invalidateAllLookups
  }), [
    state,
    setLoading,
    setError,
    validateRole,
    handleRowValidating,
    validateRowUpdating,
    getDefaultRoleValues,
    handleRoleEditorPreparing,
    handleRoleInitNewRow,
    invalidateAllLookups
  ]);
  
  return (
    <RolesContext.Provider value={contextValue}>
      {children}
    </RolesContext.Provider>
  );
}

// Custom hook to use the roles context
export function useRoles(): RolesContextType {
  const context = useContext(RolesContext);
  if (context === undefined) {
    throw new Error('useRoles must be used within a RolesProvider');
  }
  return context;
}
