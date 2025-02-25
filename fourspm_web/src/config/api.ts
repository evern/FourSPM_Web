interface ApiEndpoints {
    login: string;
    logout: string;
    register: string;
    create: string;
    projects: string;
    resetPassword: string;
    changePassword: string;
}

interface ApiConfig {
    baseUrl: string;
    endpoints: ApiEndpoints;
}

const productionConfig: ApiConfig = {
    baseUrl: 'https://api.4spm.org',  // All API endpoints through api.4spm.org
    endpoints: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        register: '/api/auth/register',
        create: '/api/auth/create',
        resetPassword: '/api/auth/reset-password',
        changePassword: '/api/auth/change-password',
        projects: '/odata/v1/Projects'  // Full path for OData endpoint
    }
};

const developmentConfig: ApiConfig = {
    baseUrl: 'https://localhost:7246',  // Updated to use HTTPS and the correct port
    endpoints: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        register: '/api/auth/register',
        create: '/api/auth/create',
        resetPassword: '/api/auth/reset-password',
        changePassword: '/api/auth/change-password',
        projects: '/Projects'  // Remove odata/v1 prefix since it's handled in the ODataStore config
    }
};

export const API_CONFIG: ApiConfig = process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig;
