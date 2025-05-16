import React, { createContext, useCallback, useMemo, useReducer, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { usePermissionDataProvider } from '../../hooks/data-providers/usePermissionDataProvider';
import { Permission } from '../../types/permission-types';

// Context state type
interface PermissionsContextState {
  selectedPermissionIds: string[];
  isSaving: boolean;
  hasSaved: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

// Context actions
type PermissionsContextAction =
  | { type: 'SET_SELECTED_PERMISSIONS'; payload: string[] }
  | { type: 'SAVING_START' }
  | { type: 'SAVING_SUCCESS' }
  | { type: 'SAVING_ERROR'; payload: string }
  | { type: 'RESET_SAVE_STATE' };

// Initial state
const initialState: PermissionsContextState = {
  selectedPermissionIds: [],
  isSaving: false,
  hasSaved: false,
  hasError: false,
  errorMessage: null
};

// Context value type
interface PermissionsContextValue extends PermissionsContextState {
  // Methods
  setSelectedPermissions: (permissionIds: string[]) => void;
  savePermissions: () => Promise<void>;
  resetSaveState: () => void;
  // Data
  permissions: Permission[];
  isLoading: boolean;
}

// Create the context
const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

// State reducer
const reducer = (state: PermissionsContextState, action: PermissionsContextAction): PermissionsContextState => {
  switch (action.type) {
    case 'SET_SELECTED_PERMISSIONS':
      return {
        ...state,
        selectedPermissionIds: action.payload
      };
    case 'SAVING_START':
      return {
        ...state,
        isSaving: true,
        hasSaved: false,
        hasError: false,
        errorMessage: null
      };
    case 'SAVING_SUCCESS':
      return {
        ...state,
        isSaving: false,
        hasSaved: true
      };
    case 'SAVING_ERROR':
      return {
        ...state,
        isSaving: false,
        hasError: true,
        errorMessage: action.payload
      };
    case 'RESET_SAVE_STATE':
      return {
        ...state,
        isSaving: false,
        hasSaved: false,
        hasError: false,
        errorMessage: null
      };
    default:
      return state;
  }
};

/**
 * Provider component for permissions management
 */
export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { roleId } = useParams<{ roleId: string }>();
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Get the data provider for permissions
  const { 
    permissions, 
    isLoading, 
    getRolePermissions, 
    assignPermissionsToRole 
  } = usePermissionDataProvider();
  
  // Load role permissions on component mount
  React.useEffect(() => {
    const loadRolePermissions = async () => {
      if (roleId) {
        try {
          const rolePermissions = await getRolePermissions(roleId);
          dispatch({ 
            type: 'SET_SELECTED_PERMISSIONS', 
            payload: rolePermissions.map(p => p.id) 
          });
        } catch (error) {
          console.error('Error loading role permissions:', error);
        }
      }
    };
    
    loadRolePermissions();
  }, [roleId, getRolePermissions]);
  
  // Methods
  const setSelectedPermissions = useCallback((permissionIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_PERMISSIONS', payload: permissionIds });
  }, []);
  
  const savePermissions = useCallback(async () => {
    if (!roleId) return;
    
    dispatch({ type: 'SAVING_START' });
    
    try {
      await assignPermissionsToRole(roleId, state.selectedPermissionIds);
      dispatch({ type: 'SAVING_SUCCESS' });
    } catch (error) {
      console.error('Error saving permissions:', error);
      dispatch({ 
        type: 'SAVING_ERROR', 
        payload: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  }, [roleId, state.selectedPermissionIds, assignPermissionsToRole]);
  
  const resetSaveState = useCallback(() => {
    dispatch({ type: 'RESET_SAVE_STATE' });
  }, []);
  
  // Create the context value
  const contextValue = useMemo(() => ({
    // State
    ...state,
    // Methods
    setSelectedPermissions,
    savePermissions,
    resetSaveState,
    // Data
    permissions,
    isLoading
  }), [
    state,
    setSelectedPermissions,
    savePermissions,
    resetSaveState,
    permissions,
    isLoading
  ]);
  
  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
};

/**
 * Hook for accessing the permissions context
 */
export const usePermissions = (): PermissionsContextValue => {
  const context = useContext(PermissionsContext);
  
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  
  return context;
};
