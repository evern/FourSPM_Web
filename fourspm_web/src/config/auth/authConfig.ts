/**
 * Authentication and authorization configuration
 * Centralizes all auth-related configuration settings
 * following the FourSPM UI Development Guidelines
 */
import { msalConfig } from './msalConfig';
import { API_CONFIG } from '../api';
import { CommonPermissions, SystemRoles } from '../permissions';

// Token cache keys
export const TOKEN_STORAGE_KEY = 'fourspm_auth_token';
export const USER_STORAGE_KEY = 'fourspm_user';

// Auth configuration settings
export const AUTH_CONFIG = {
  // Azure AD configuration
  azureAd: msalConfig,
  
  // JWT token configuration
  jwt: {
    audience: API_CONFIG.baseUrl,
    issuer: 'https://login.microsoftonline.com/3c7fa9e9-64e7-443c-905a-d9134ca00da9',
    tokenExpiryThresholdMs: 300000, // 5 minutes before expiry to refresh
    scopesForUser: ['User.Read', 'User.ReadBasic.All'],
    scopesForApi: [`api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/.default`]
  },
  
  // Minimal permission requirements for critical pages
  requiredPermissions: {
    roleManagement: CommonPermissions.VIEW_ROLES,
    userManagement: CommonPermissions.VIEW_USERS,
    projectAccess: CommonPermissions.VIEW_PROJECTS,
    deliverableAccess: CommonPermissions.VIEW_DELIVERABLES,
    systemAdmin: CommonPermissions.SYSTEM_ADMIN
  },
  
  // System role configuration
  systemRoles: {
    // Roles that can't be deleted or modified by users
    protectedRoles: [
      SystemRoles.ADMINISTRATOR,
      SystemRoles.GUEST
    ],
    // Default role for new users
    defaultRole: SystemRoles.GUEST
  },
  
  // Authentication routes
  routes: {
    login: '/login',
    unauthorized: '/unauthorized',
    defaultRedirect: '/dashboard'
  }
};

/**
 * Helper function to check if a role is a protected system role
 * that cannot be modified or deleted
 */
export const isProtectedRole = (roleName: string): boolean => {
  return AUTH_CONFIG.systemRoles.protectedRoles.includes(roleName as SystemRoles);
};

/**
 * Gets the required permission for a specific action on a feature
 * Used to standardize permission checks across the application
 */
export const getRequiredPermission = (feature: string): string | undefined => {
  return (AUTH_CONFIG.requiredPermissions as Record<string, string>)[feature];
};
