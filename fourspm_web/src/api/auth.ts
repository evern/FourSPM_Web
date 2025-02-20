import defaultUser from '../utils/default-user';
import { API_CONFIG } from "@/config/api";

// Define interfaces for our types
interface User {
  token?: string;
  email?: string;
  [key: string]: any; // For other properties from defaultUser
}

interface ApiResponse<T = any> {
  isOk: boolean;
  data?: T;
  message?: string;
}

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function apiRequest(url: string, options: RequestOptions = {}): Promise<Response> {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Get the stored user data and add the token to headers if available
  const userStr = localStorage.getItem('user');
  const user: User | null = userStr ? JSON.parse(userStr) : null;
  if (user?.token) {
    defaultHeaders['Authorization'] = `Bearer ${user.token}`;
  }

  const mergedOptions: RequestOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    console.log('Making request to:', url);
    console.log('With options:', JSON.stringify(mergedOptions, null, 2));
    
    const response = await fetch(url, mergedOptions);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        // Clear stored user data and redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }

      const errorText = await response.text();
      console.error('Server error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - Check if the server is running and accessible');
      throw new Error('Unable to connect to the server. Please check if the server is running.');
    }
    throw error;
  }
}

export async function signIn(email: string, password: string): Promise<ApiResponse<User>> {
  try {
    const response = await apiRequest(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.login}`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    const user: User = {
      ...defaultUser,
      token: data.token,
      email
    };
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    return {
      isOk: true,
      data: user,
    };
  }
  catch {
    return {
      isOk: false,
      message: "Authentication failed"
    };
  }
}

export async function getUser(): Promise<ApiResponse<User>> {
  try {
    // Send request
    return {
      isOk: true,
      data: defaultUser
    };
  }
  catch {
    return {
      isOk: false
    };
  }
}

export async function createAccount(email: string, password: string): Promise<ApiResponse> {
  try {
    // Send request
    console.log(email, password);

    return {
      isOk: true
    };
  }
  catch {
    return {
      isOk: false,
      message: "Failed to create account"
    };
  }
}

export async function changePassword(email: string, recoveryCode: string): Promise<ApiResponse> {
  try {
    // Send request
    console.log(email, recoveryCode);

    return {
      isOk: true
    };
  }
  catch {
    return {
      isOk: false,
      message: "Failed to change password"
    }
  }
}

export async function resetPassword(email: string): Promise<ApiResponse> {
  try {
    // Send request
    console.log(email);

    return {
      isOk: true
    };
  }
  catch {
    return {
      isOk: false,
      message: "Failed to reset password"
    };
  }
}
