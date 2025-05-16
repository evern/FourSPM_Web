import { Configuration, LogLevel } from '@azure/msal-browser';
import { Environment, CURRENT_ENVIRONMENT } from '../environment';

/**
 * Environment-specific MSAL configurations
 */
const msalEnvironmentConfig = {
  [Environment.PRODUCTION]: {
    clientId: 'c67bf91d-8b6a-494a-8b99-c7a4592e08c1',
    tenantId: '3c7fa9e9-64e7-443c-905a-d9134ca00da9'
  },
  [Environment.STAGING]: {
    clientId: 'c67bf91d-8b6a-494a-8b99-c7a4592e08c1', // Using same client ID for staging
    tenantId: '3c7fa9e9-64e7-443c-905a-d9134ca00da9'
  },
  [Environment.TEST]: {
    clientId: 'c67bf91d-8b6a-494a-8b99-c7a4592e08c1', // Using same client ID for test
    tenantId: '3c7fa9e9-64e7-443c-905a-d9134ca00da9'
  },
  [Environment.DEVELOPMENT]: {
    clientId: 'c67bf91d-8b6a-494a-8b99-c7a4592e08c1',
    tenantId: '3c7fa9e9-64e7-443c-905a-d9134ca00da9'
  }
};

// Get configuration for current environment
const currentEnvConfig = msalEnvironmentConfig[CURRENT_ENVIRONMENT];

// MSAL configuration for Azure AD authentication
export const msalConfig: Configuration = {
  auth: {
    clientId: currentEnvConfig.clientId,
    authority: `https://login.microsoftonline.com/${currentEnvConfig.tenantId}`,
    redirectUri: window.location.origin, // Will be correct for each environment
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage', // Changed from sessionStorage to localStorage for persistence
    storeAuthStateInCookie: true // Enable for better state management across navigations
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
        }
      },
      logLevel: LogLevel.Info
    }
  }
};

// Permission scopes for API access
export const loginRequest = {
  scopes: ['User.Read', 'api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User']
};

export const adminRequest = {
  scopes: ['User.Read', 'api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.Admin']
};
