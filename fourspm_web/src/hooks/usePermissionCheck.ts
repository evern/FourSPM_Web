/**
 * Custom hook for checking user permissions
 * Follows the established pattern for hooks in the application
 */
import { useCallback, useState, useEffect } from 'react';
import { fetchCurrentUserPermissions } from '../adapters/user-permission.adapter';

// Store for caching permissions to avoid repeated API calls
let cachedPermissions: string[] = [];

// Track if permissions have been loaded to avoid redundant API calls
let permissionsLoaded = false;

// Expose a reset function to the window object to allow clearing permissions from anywhere
// This avoids circular dependencies when importing from msal-auth.tsx
(window as any).resetPermissionCache = () => {

  cachedPermissions = [];
  permissionsLoaded = false;
};

/**
 * Hook for checking user permissions
 * @returns Functions to check various permission types and loading state
 */
export const usePermissionCheck = () => {
  // Track loading state
  const [loading, setLoading] = useState(!permissionsLoaded);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Load permissions from the API
   */
  const loadPermissions = useCallback(async () => {
    // Skip if already loaded
    if (permissionsLoaded && cachedPermissions.length > 0) {
      return cachedPermissions;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch permissions from the API
      const permissions = await fetchCurrentUserPermissions();
      
      // Update cache
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
  
  // Load permissions on hook initialization
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  /**
   * Check if the user has a specific permission
   */
  const hasPermission = useCallback((permissionName: string): boolean => {
    return cachedPermissions.includes(permissionName);
  }, []);

  /**
   * Check if the user has view permission for a resource
   */
  const hasViewPermission = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}.view`);
  }, [hasPermission]);

  /**
   * Check if the user has edit permission for a resource
   */
  const hasEditPermission = useCallback((resource: string): boolean => {
    return hasPermission(`${resource}.edit`);
  }, [hasPermission]);

  /**
   * Function to initialize permissions from an API response
   */
  const initializePermissions = useCallback((permissions: { name: string }[]) => {
    cachedPermissions = permissions.map(p => p.name);
  }, []);

  /**
   * Simplified utility functions for common permission checks
   */
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
