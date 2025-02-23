interface ApiEndpoints {
    login: string;
    logout: string;
    projects: string;
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
        projects: '/odata/v1/Projects'
    }
}
