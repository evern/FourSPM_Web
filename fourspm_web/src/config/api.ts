import { Environment, CURRENT_ENVIRONMENT, Environment as Env } from './environment';

/**
 * Interface for authentication endpoints
 */
interface AuthEndpoints {
    login: string;
    logout: string;
    register: string;
    create: string;
    projects: string; // Used for token validation
    resetPassword: string;
    changePassword: string;
}

/**
 * Interface for API configuration
 */
interface ApiConfig {
    baseUrl: string;
    endpoints: AuthEndpoints;
    odataPath: string; // Path prefix for all OData endpoints
    apiPath: string;   // Path prefix for all API endpoints
    version: string;   // API version
}

/**
 * Production environment configuration
 */
const productionConfig: ApiConfig = {
    baseUrl: 'https://api.4spm.org',
    apiPath: '/api',
    odataPath: '/odata/v1',
    version: 'v1',
    endpoints: {
        login: '/auth/login',
        logout: '/auth/logout',
        register: '/auth/register',
        create: '/auth/create',
        resetPassword: '/auth/reset-password',
        changePassword: '/auth/change-password',
        projects: '/Projects'
    }
};

/**
 * Staging environment configuration
 */
const stagingConfig: ApiConfig = {
    baseUrl: 'https://staging-api.4spm.org',
    apiPath: '/api',
    odataPath: '/odata/v1',
    version: 'v1',
    endpoints: {
        login: '/auth/login',
        logout: '/auth/logout',
        register: '/auth/register',
        create: '/auth/create',
        resetPassword: '/auth/reset-password',
        changePassword: '/auth/change-password',
        projects: '/Projects'
    }
};

/**
 * Test environment configuration
 */
const testConfig: ApiConfig = {
    baseUrl: 'https://test-api.4spm.org',
    apiPath: '/api',
    odataPath: '/odata/v1',
    version: 'v1',
    endpoints: {
        login: '/auth/login',
        logout: '/auth/logout',
        register: '/auth/register',
        create: '/auth/create',
        resetPassword: '/auth/reset-password',
        changePassword: '/auth/change-password',
        projects: '/Projects'
    }
};

/**
 * Development environment configuration
 */
const developmentConfig: ApiConfig = {
    baseUrl: 'https://localhost:7246',
    apiPath: '/api',
    odataPath: '/odata/v1',
    version: 'v1',
    endpoints: {
        login: '/auth/login',
        logout: '/auth/logout',
        register: '/auth/register',
        create: '/auth/create',
        resetPassword: '/auth/reset-password',
        changePassword: '/auth/change-password',
        projects: '/Projects'
    }
};

/**
 * Get the appropriate configuration based on current environment
 * Uses the environment detection system for consistent environment determination
 */
const getEnvironmentConfig = (): ApiConfig => {
    switch (CURRENT_ENVIRONMENT) {
        case Env.PRODUCTION:
            return productionConfig;
        case Env.STAGING:
            return stagingConfig;
        case Env.TEST:
            return testConfig;
        case Env.DEVELOPMENT:
        default:
            return developmentConfig;
    }
};

/**
 * Exported API configuration for use throughout the application
 */
export const API_CONFIG: ApiConfig = getEnvironmentConfig();

/**
 * Helper function to construct a full API endpoint URL
 */
export const getApiEndpoint = (endpoint: string): string => {
    return `${API_CONFIG.baseUrl}${API_CONFIG.apiPath}${endpoint}`;
};

/**
 * Helper function to construct a full OData endpoint URL
 */
export const getODataEndpoint = (entity: string): string => {
    return `${API_CONFIG.baseUrl}${API_CONFIG.odataPath}/${entity}`;
};

