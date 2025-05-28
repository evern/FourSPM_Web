
import { useCallback, useState, useEffect } from 'react';
import { fetchCurrentUserPermissions } from '../adapters/user-permission.adapter';


let cachedPermissions: string[] = [];


let permissionsLoaded = false;


(window as any).resetPermissionCache = () => {

  cachedPermissions = [];
  permissionsLoaded = false;
};


export const usePermissionCheck = () => {

  const [loading, setLoading] = useState(!permissionsLoaded);
  const [error, setError] = useState<string | null>(null);
  

  const loadPermissions = useCallback(async () => {

    if (permissionsLoaded && cachedPermissions.length > 0) {
      return cachedPermissions;
    }
    
    try {
      setLoading(true);
      setError(null);
      

      const permissions = await fetchCurrentUserPermissions();
      

      cachedPermissions = permissions.map(p => p.name);
      permissionsLoaded = true;
      
      setLoading(false);
      return cachedPermissions;
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error loading permissions');
      setLoading(false);
      return [];
    }
  }, []);
  

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);


  const hasPermission = useCallback((permissionName: string): boolean => {
    return cachedPermissions.includes(permissionName);
  }, []);


  const hasViewPermission = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}.view`);
  }, [hasPermission]);


  const hasEditPermission = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}.edit`);
  }, [hasPermission]);


  const initializePermissions = useCallback((permissions: { name: string }[]) => {
    cachedPermissions = permissions.map(p => p.name);
  }, []);


  const canView = useCallback((resource: string): boolean => {
    return hasViewPermission(resource);
  }, [hasViewPermission]);

  const canEdit = useCallback((resource: string): boolean => {
    return hasEditPermission(resource);
  }, [hasEditPermission]);

  return {
    hasPermission,
    hasViewPermission,
    hasEditPermission,
    initializePermissions,
    canView,
    canEdit,
    loadPermissions,
    loading,
    error,
    isLoaded: permissionsLoaded
  };
};
