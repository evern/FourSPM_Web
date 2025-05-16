import { Configuration, LogLevel } from '@azure/msal-browser';

/**
 * Configuration for Microsoft Authentication Library (MSAL)
 * Used for Azure AD authentication with Single Sign-On
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || 'c67bf91d-8b6a-494a-8b99-c7a4592e08c1',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_TENANT_ID || '3c7fa9e9-64e7-443c-905a-d9134ca00da9'}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false     // Set this to "true" if you're having issues with IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
        }
      },
      logLevel: process.env.NODE_ENV === 'development' ? LogLevel.Verbose : LogLevel.Warning
    }
  }
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API
 * For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const loginRequest = {
  scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.User']
};

/**
 * Add here the scopes to request when obtaining an access token for admin operations
 */
export const adminRequest = {
  scopes: ['api://c67bf91d-8b6a-494a-8b99-c7a4592e08c1/Application.Admin']
};
