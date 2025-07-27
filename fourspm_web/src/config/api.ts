import { API_BASE_URL } from './deployment';

interface AuthEndpoints {
    login: string;
    logout: string;
    register: string;
    create: string;
    projects: string; // Used for token validation
    resetPassword: string;
    changePassword: string;
}

interface ApiConfig {
    baseUrl: string;
    endpoints: AuthEndpoints;
}

const productionEndpoints: AuthEndpoints = {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    create: '/api/auth/create',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
    projects: '/odata/v1/Projects'  // Full path for OData endpoint, used for token validation
};

const developmentEndpoints: AuthEndpoints = {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    register: '/api/auth/register',
    create: '/api/auth/create',
    resetPassword: '/api/auth/reset-password',
    changePassword: '/api/auth/change-password',
    projects: '/Projects'  // Remove odata/v1 prefix since it's handled in the ODataStore config
};

export const API_CONFIG: ApiConfig = {
    baseUrl: API_BASE_URL,
    endpoints: process.env.NODE_ENV === 'production' ? productionEndpoints : developmentEndpoints
};
