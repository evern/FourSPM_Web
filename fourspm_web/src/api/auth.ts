import defaultUser from '../utils/default-user';
import { API_CONFIG } from "../config/api";
import { apiRequest, RequestOptions } from './apiClient';
import { User } from '../types';

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
    // Get user from localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      return {
        isOk: false,
        message: 'No user found'
      };
    }

    const user: User = JSON.parse(userJson);

    // Validate token with a backend request
    try {
      const response = await apiRequest(`${API_CONFIG.baseUrl}/odata/v1/Projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        return {
          isOk: true,
          data: user
        };
      } else {
        // Token is invalid
        localStorage.removeItem('user');
        return {
          isOk: false,
          message: 'Token expired'
        };
      }
    } catch (error) {
      // Network or other error
      localStorage.removeItem('user');
      return {
        isOk: false,
        message: 'Failed to validate token'
      };
    }
  }
  catch (error) {
    return {
      isOk: false,
      message: 'Invalid user data'
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
