import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { VariationsContextType, VariationsState, VariationsAction, EditorEvent, InitNewRowEvent } from './variations-types';
import { variationsReducer, initialVariationsState } from './variations-reducer';
import { Variation } from '../../types/odata-types';
import { ValidationRule } from '../../hooks/interfaces/grid-operation-hook.interfaces';
import { useAuth } from '../auth';
import { VARIATIONS_ENDPOINT } from '../../config/api-endpoints';
import { createVariation, updateVariation, deleteVariation, getProjectVariations } from '../../adapters/variation.adapter';
import { v4 as uuidv4 } from 'uuid';

// Create the context with a default undefined value
const VariationsContext = createContext<VariationsContextType | undefined>(undefined);

interface VariationsProviderProps {
  children: ReactNode;
}

export function VariationsProvider({ children }: VariationsProviderProps) {
  const [state, dispatch] = useReducer(variationsReducer, initialVariationsState);
  const { user } = useAuth();
  
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
  
  // Fetch variations for a project
  const fetchVariations = useCallback(async (projectId: string) => {
    if (!user?.token || !isMountedRef.current) return;
    
    try {
      dispatch({ type: 'FETCH_VARIATIONS_START' });
      const variations = await getProjectVariations(projectId, user.token);
      
      if (isMountedRef.current) {
        dispatch({ type: 'FETCH_VARIATIONS_SUCCESS', payload: variations });
      }
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ type: 'FETCH_VARIATIONS_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch variations' });
      }
    }
  }, [user?.token]);
  
  // Add a new variation
  const addVariation = useCallback(async (variation: Variation): Promise<Variation> => {
    if (!user?.token || !isMountedRef.current) {
      throw new Error('Unable to create variation - user is not authenticated');
    }
    
    try {
      dispatch({ type: 'ADD_VARIATION_START', payload: variation });
      const newVariation = await createVariation(variation, user.token);
      
      if (isMountedRef.current) {
        dispatch({ type: 'ADD_VARIATION_SUCCESS', payload: newVariation });
      }
      return newVariation;
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ 
          type: 'ADD_VARIATION_ERROR', 
          payload: { 
            error: error instanceof Error ? error.message : 'Failed to create variation',
            variation
          } 
        });
      }
      throw error;
    }
  }, [user?.token]);
  
  // Update an existing variation
  const updateVariationFunc = useCallback(async (variation: Variation): Promise<Variation> => {
    if (!user?.token || !isMountedRef.current) {
      throw new Error('Unable to update variation - user is not authenticated');
    }
    
    try {
      dispatch({ type: 'UPDATE_VARIATION_START', payload: variation });
      await updateVariation(variation, user.token);
      
      if (isMountedRef.current) {
        dispatch({ type: 'UPDATE_VARIATION_SUCCESS', payload: variation });
      }
      return variation;
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ 
          type: 'UPDATE_VARIATION_ERROR', 
          payload: { 
            error: error instanceof Error ? error.message : 'Failed to update variation',
            variation
          } 
        });
      }
      throw error;
    }
  }, [user?.token]);
  
  // Delete a variation
  const deleteVariationFunc = useCallback(async (id: string): Promise<void> => {
    if (!user?.token || !isMountedRef.current) {
      throw new Error('Unable to delete variation - user is not authenticated');
    }
    
    try {
      dispatch({ type: 'DELETE_VARIATION_START', payload: id });
      await deleteVariation(id, user.token);
      
      if (isMountedRef.current) {
        dispatch({ type: 'DELETE_VARIATION_SUCCESS', payload: id });
      }
    } catch (error) {
      if (isMountedRef.current) {
        dispatch({ 
          type: 'DELETE_VARIATION_ERROR', 
          payload: { 
            error: error instanceof Error ? error.message : 'Failed to delete variation',
            id
          } 
        });
      }
      throw error;
    }
  }, [user?.token]);
  
  // Validate variation
  const validateVariation = useCallback((variation: Variation, rules: ValidationRule[] = []) => {
    if (!isMountedRef.current) return false;
    
    const errors: Record<string, string[]> = {};
    
    // Process each validation rule
    rules.forEach(rule => {
      const fieldValue = variation[rule.field as keyof Variation];
      
      if (rule.required && (!fieldValue || fieldValue === '')) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} is required`);
      }
      
      if (rule.maxLength && typeof fieldValue === 'string' && fieldValue.length > rule.maxLength) {
        errors[rule.field] = errors[rule.field] || [];
        errors[rule.field].push(rule.errorText || `${rule.field} must be at most ${rule.maxLength} characters`);
      }
    });
    
    // Update validation errors state
    if (Object.keys(errors).length > 0) {
      if (isMountedRef.current) {
        dispatch({ type: 'SET_VALIDATION_ERRORS', payload: errors });
      }
      return false;
    } else {
      if (isMountedRef.current) {
        dispatch({ type: 'CLEAR_VALIDATION_ERRORS' });
      }
      return true;
    }
  }, []);
  
  // Editor-specific functions
  // Get default values for a new variation
  const getDefaultVariationValues = useCallback((projectId?: string): Partial<Variation> => {
    return {
      guid: uuidv4(),
      projectGuid: projectId || '',
      name: '',
      comments: ''
      // No created/createdBy fields as they should be handled by the server
    };
  }, []);
  
  // Handle editor field preparation
  const handleVariationEditorPreparing = useCallback((e: EditorEvent) => {
    const { dataField, editorOptions } = e;
    
    // Get original onValueChanged if it exists
    const originalSetValue = editorOptions.onValueChanged;
    
    // Add validation or custom behavior for specific fields
    if (dataField === 'name') {
      // Example: Add character limit warning
      editorOptions.maxLength = 100;
      editorOptions.onValueChanged = (args: any) => {
        if (originalSetValue) {
          originalSetValue(args);
        }
        
        // Could add custom validation or other behavior here
      };
    }
    
    // Custom handling for the comments field
    if (dataField === 'comments') {
      editorOptions.height = 80; // Make the comments field taller
    }
  }, []);
  
  // Handle new variation row initialization
  const handleVariationInitNewRow = useCallback((e: InitNewRowEvent) => {
    if (e?.data) {
      // Apply default variation values
      // We need to extract the projectId from the component or current filter
      const projectId = e.component?.option('defaultFilter')?.[0]?.[2] || '';
      const defaults = getDefaultVariationValues(projectId);
      Object.assign(e.data, defaults);
    }
  }, [getDefaultVariationValues]);

  // CRITICAL: Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    state,
    validateVariation,
    fetchVariations,
    addVariation,
    updateVariation: updateVariationFunc,
    deleteVariation: deleteVariationFunc,
    // Add editor functions
    getDefaultVariationValues,
    handleVariationEditorPreparing,
    handleVariationInitNewRow
  }), [
    state, 
    validateVariation,
    fetchVariations,
    addVariation,
    updateVariationFunc,
    deleteVariationFunc,
    // Add editor dependencies
    getDefaultVariationValues,
    handleVariationEditorPreparing,
    handleVariationInitNewRow
  ]);
  
  return (
    <VariationsContext.Provider value={contextValue}>
      {children}
    </VariationsContext.Provider>
  );
}

// Custom hook to use the variations context
export function useVariations(): VariationsContextType {
  const context = useContext(VariationsContext);
  if (context === undefined) {
    throw new Error('useVariations must be used within a VariationsProvider');
  }
  return context;
}
