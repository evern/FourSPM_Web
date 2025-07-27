// Centralized deployment configuration
// Update these values when deploying to different environments

export interface DeploymentConfig {
  // Azure AD Configuration
  azureAd: {
    clientId: string;
    tenantId: string;
    instance: string;
  };
  
  // API Configuration
  api: {
    baseUrl: string;
  };
  
  // Environment
  environment: 'development' | 'production';
}

// Development Configuration
const developmentConfig: DeploymentConfig = {
  azureAd: {
    clientId: 'b86ba6d7-c851-4725-8f6b-d7331813eb14',
    tenantId: '83d9fae5-8296-4b92-99fe-b844e37d2ad5',
    instance: 'https://login.microsoftonline.com/',
  },
  api: {
    baseUrl: 'https://localhost:7246',
  },
  environment: 'development'
};

// Production Configuration
const productionConfig: DeploymentConfig = {
  azureAd: {
    clientId: 'b86ba6d7-c851-4725-8f6b-d7331813eb14',
    tenantId: '83d9fae5-8296-4b92-99fe-b844e37d2ad5',
    instance: 'https://login.microsoftonline.com/',
  },
  api: {
    baseUrl: 'https://fourspmwebservice20250725180206-ewb3e9gdgthjbmea.southeastasia-01.azurewebsites.net',
  },
  environment: 'production'
};

// Export the appropriate configuration based on NODE_ENV
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🚀 Using config:', process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT');

export const DEPLOYMENT_CONFIG: DeploymentConfig = 
  process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig;

// Derived values for convenience
export const CLIENT_ID = DEPLOYMENT_CONFIG.azureAd.clientId;
export const TENANT_ID = DEPLOYMENT_CONFIG.azureAd.tenantId;
export const API_BASE_URL = DEPLOYMENT_CONFIG.api.baseUrl;
export const AZURE_AD_AUTHORITY = `${DEPLOYMENT_CONFIG.azureAd.instance}${DEPLOYMENT_CONFIG.azureAd.tenantId}`;
export const API_SCOPE_BASE = `api://${CLIENT_ID}`;

// API Scopes
export const API_SCOPES = {
  USER: `${API_SCOPE_BASE}/Application.User`,
  ADMIN: `${API_SCOPE_BASE}/Application.Admin`
} as const;
