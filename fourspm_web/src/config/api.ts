interface ApiEndpoints {
    login: string;
    logout: string;
    create: string;
    projects: string;
    resetPassword: string;
    changePassword: string;
}

interface ApiConfig {
    baseUrl: string;
    endpoints: ApiEndpoints;
}

export const API_CONFIG: ApiConfig = {
    baseUrl: 'https://localhost:7246',  // Updated to use HTTPS and the correct port
    endpoints: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        create: '/api/auth/create',
        resetPassword: '/api/auth/reset-password',
        changePassword: '/api/auth/change-password',
        projects: '/Projects'  // Remove odata/v1 prefix since it's handled in the ODataStore config
    }
}
