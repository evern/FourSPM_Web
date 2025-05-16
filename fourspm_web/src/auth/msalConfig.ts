/**
 * MSAL Configuration for Azure AD Authentication
 */
import { Configuration, LogLevel } from '@azure/msal-browser';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isStaging = process.env.REACT_APP_ENVIRONMENT === 'staging';

// Auth configuration values
const CLIENT_ID = process.env.REACT_APP_CLIENT_ID || ''; // Azure AD client ID
const AUTHORITY = `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID || 'common'}`;
const REDIRECT_URI = isProduction
  ? 'https://fourspm.company.com' // Production redirect URI
  : isStaging
    ? 'https://staging.fourspm.company.com' // Staging redirect URI
    : 'http://localhost:3000'; // Development redirect URI

// MSAL configuration object
export const msalConfig: Configuration = {
  auth: {
    clientId: CLIENT_ID,
    authority: AUTHORITY,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage', // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues with IE/Edge
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
            if (!isProduction) console.info(message);
            break;
          case LogLevel.Verbose:
            if (!isProduction) console.debug(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
        }
      },
      logLevel: isProduction ? LogLevel.Warning : LogLevel.Info,
    },
  },
};

// Login request object - scopes we want to request
export const loginRequest = {
  scopes: ['User.Read', 'profile', 'openid', 'email'],
};

// Graph API request object - scopes for Microsoft Graph
export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
};
