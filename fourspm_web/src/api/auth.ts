import defaultUser from '../utils/default-user';
import { API_CONFIG } from "@/config/api";
import { apiRequest, RequestOptions } from './apiClient';
import { User } from '@/types';

// Define interfaces for our types
interface ApiResponse<T = any> {
  isOk: boolean;
  data?: T;
  message?: string;
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

export async function signOut() {
  try {
    await apiRequest(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.logout}`, {
      method: 'POST'
    });
    // Remove user from localStorage
    localStorage.removeItem('user');
    return {
      isOk: true
    };
  } catch {
    return {
      isOk: false,
      message: 'Logout failed'
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
