import React, { createContext, useReducer, useContext, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';

import {
  PermissionsContextProps,
  PermissionsProviderProps,
  PermissionsState,
  StaticPermission,
  RolePermission,
  PermissionAssignment,
  PermissionLevel,
  Role
} from './permissions-types';
import { initialPermissionsState, permissionsReducer } from './permissions-reducer';
import {
  fetchStaticPermissions as fetchStaticPermissionsApi,
  fetchRolePermissions as fetchRolePermissionsApi,
  addPermissionToRole,
  removePermissionFromRole,
  replacePermission,
  getRole as getRoleApi
} from '../../adapters/permission.adapter';

// Create the context
const PermissionsContext = createContext<PermissionsContextProps | undefined>(undefined);

/**
 * Provider component for the permissions context
 * Follows the Context+Reducer pattern used throughout the application
 */
export function PermissionsProvider({
  children,
  roleId: rolePropId
}: PermissionsProviderProps): React.ReactElement {
  // Get role ID from props or URL params
  const params = useParams<{ roleId: string }>();
  const roleId = rolePropId || params.roleId;
  
  // Track component mount state to prevent state updates after unmounting
  const isMountedRef = useRef(true);
  
  // Initialize state with reducer
  const [state, dispatch] = useReducer(permissionsReducer, {
    ...initialPermissionsState
  });
  
  // Action creators
  const setLoading = useCallback((loading: boolean) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = useCallback((error: string | null) => {
    if (!isMountedRef.current) return;
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  // Set up mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Fetch static permissions from the backend
  const fetchStaticPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const permissions = await fetchStaticPermissionsApi();
      
      if (isMountedRef.current) {
        dispatch({ type: 'SET_STATIC_PERMISSIONS', payload: permissions });
      }
      
      return permissions;
    } catch (error) {
      if (isMountedRef.current) {
        setError('Failed to fetch permissions');
      }
      console.error('Error fetching static permissions:', error);
      return [];
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [setLoading, setError]);
  
  // Fetch role permissions from the backend
  const fetchRolePermissions = useCallback(async (roleGuid: string) => {
    try {
      setLoading(true);
      const permissions = await fetchRolePermissionsApi(roleGuid);
      
      if (isMountedRef.current) {
        dispatch({ type: 'SET_ROLE_PERMISSIONS', payload: permissions });
      }
      
      return permissions;
    } catch (error) {
      if (isMountedRef.current) {
        setError('Failed to fetch role permissions');
      }
      console.error('Error fetching role permissions:', error);
      return [];
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [setLoading, setError]);
  
  // Fetch role details
  const getRole = useCallback(async (roleGuid: string) => {
    try {
      setLoading(true);
      const role = await getRoleApi(roleGuid);
      
      if (isMountedRef.current) {
        dispatch({ type: 'SET_ROLE', payload: role });
      }
      
      return role;
    } catch (error) {
      if (isMountedRef.current) {
        setError('Failed to fetch role details');
      }
      console.error('Error fetching role details:', error);
      return null;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [setLoading, setError]);
  
  // Build permission assignments by combining static permissions with role permissions
  const buildPermissionAssignments = useCallback(
    (staticPermissions: StaticPermission[], rolePermissions: RolePermission[]): PermissionAssignment[] => {
      return staticPermissions.map(staticPermission => {
        const { featureKey } = staticPermission;
        
        // Look for view and edit permissions for this feature
        const viewPermission = rolePermissions.find(p => p.permission === `${featureKey}.view`);
        const editPermission = rolePermissions.find(p => p.permission === `${featureKey}.edit`);
        
        // Determine the permission level based on which permissions are assigned
        let permissionLevel = PermissionLevel.NONE;
        if (editPermission) {
          permissionLevel = PermissionLevel.FULL_ACCESS;
        } else if (viewPermission) {
          permissionLevel = PermissionLevel.READ_ONLY;
        }
        
        return {
          featureKey,
          permissionLevel,
          viewPermissionGuid: viewPermission?.guid,
          editPermissionGuid: editPermission?.guid
        };
      });
    },
    []
  );
  
  // Initialize the permission assignments when static and role permissions are loaded
  useEffect(() => {
    if (state.staticPermissions.length > 0 && state.rolePermissions.length >= 0) {
      const assignments = buildPermissionAssignments(
        state.staticPermissions,
        state.rolePermissions
      );
      
      dispatch({ type: 'SET_PERMISSION_ASSIGNMENTS', payload: assignments });
    }
  }, [state.staticPermissions, state.rolePermissions, buildPermissionAssignments]);
  
  // Initialize by loading the role, static permissions, and role permissions
  useEffect(() => {
    if (roleId) {
      dispatch({ type: 'SET_ROLE_GUID', payload: roleId });
      
      // Load role details, static permissions, and role permissions
      const loadData = async () => {
        try {
          setLoading(true);
          
          // Load data in parallel
          await Promise.all([
            getRole(roleId),
            fetchStaticPermissions(),
            fetchRolePermissions(roleId)
          ]);
        } catch (error) {
          console.error('Error initializing permissions data:', error);
          setError('Failed to initialize permissions data');
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    } else {
      setError('Role ID is required');
    }
  }, [roleId, getRole, fetchStaticPermissions, fetchRolePermissions, setLoading, setError]);
  
  // Get the current permission level for a feature
  const getPermissionLevel = useCallback(
    (featureKey: string): PermissionLevel => {
      const assignment = state.permissionAssignments.find(a => a.featureKey === featureKey);
      return assignment?.permissionLevel || PermissionLevel.NONE;
    },
    [state.permissionAssignments]
  );
  
  // Set the permission level for a feature
  const setPermissionLevel = useCallback(
    async (featureKey: string, level: PermissionLevel): Promise<void> => {
      try {
        setLoading(true);
        
        if (!roleId) {
          setError('Role ID is required');
          return Promise.reject(new Error('Role ID is required'));
        }
        
        // Find the current assignment for this feature
        const assignment = state.permissionAssignments.find(a => a.featureKey === featureKey);
        if (!assignment) {
          throw new Error(`Permission assignment not found for feature ${featureKey}`);
        }
        
        const currentLevel = assignment.permissionLevel;
        
        // If the level is the same, no changes needed
        if (currentLevel === level) {
          return;
        }
        
        let newPermissionGuid: string | undefined;
        
        // Handle transitions between permission levels
        switch (level) {
          case PermissionLevel.NONE:
            // Remove any existing permissions
            if (assignment.viewPermissionGuid) {
              await removePermissionFromRole(assignment.viewPermissionGuid);
            }
            if (assignment.editPermissionGuid) {
              await removePermissionFromRole(assignment.editPermissionGuid);
            }
            break;
            
          case PermissionLevel.READ_ONLY:
            // If transitioning from FULL_ACCESS, remove edit permission and add view permission
            if (currentLevel === PermissionLevel.FULL_ACCESS && assignment.editPermissionGuid) {
              const result = await replacePermission(
                assignment.editPermissionGuid,
                roleId,
                `${featureKey}.view`
              );
              newPermissionGuid = result.guid;
            }
            // If transitioning from NONE, just add view permission
            else if (currentLevel === PermissionLevel.NONE) {
              const result = await addPermissionToRole(roleId, `${featureKey}.view`);
              newPermissionGuid = result.guid;
            }
            break;
            
          case PermissionLevel.FULL_ACCESS:
            // If transitioning from READ_ONLY, remove view permission and add edit permission
            if (currentLevel === PermissionLevel.READ_ONLY && assignment.viewPermissionGuid) {
              const result = await replacePermission(
                assignment.viewPermissionGuid,
                roleId,
                `${featureKey}.edit`
              );
              newPermissionGuid = result.guid;
            }
            // If transitioning from NONE, just add edit permission
            else if (currentLevel === PermissionLevel.NONE) {
              const result = await addPermissionToRole(roleId, `${featureKey}.edit`);
              newPermissionGuid = result.guid;
            }
            break;
        }
        
        // Update the state with the new permission level
        dispatch({
          type: 'TOGGLE_PERMISSION',
          payload: { featureKey, level, permissionGuid: newPermissionGuid }
        });
        
        // Refresh role permissions to ensure the state is in sync with the backend
        await fetchRolePermissions(roleId);
      } catch (error) {
        console.error(`Error setting permission level for feature ${featureKey}:`, error);
        setError(`Failed to set permission level for ${featureKey}`);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [roleId, state.permissionAssignments, setLoading, setError, fetchRolePermissions]
  );
  
  // Create the context value
  const contextValue = useMemo<PermissionsContextProps>(
    () => ({
      state,
      setLoading,
      setError,
      fetchStaticPermissions,
      fetchRolePermissions,
      setPermissionLevel,
      getPermissionLevel,
      buildPermissionAssignments,
      getRole
    }),
    [
      state,
      setLoading,
      setError,
      fetchStaticPermissions,
      fetchRolePermissions,
      setPermissionLevel,
      getPermissionLevel,
      buildPermissionAssignments,
      getRole
    ]
  );
  
  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook to access the permissions context
 * Ensures the context is being used within its provider
 */
export function usePermissions(): PermissionsContextProps {
  const context = useContext(PermissionsContext);
  
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  
  return context;
}
