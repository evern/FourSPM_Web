import defaultUser from '../utils/default-user';
import { apiRequest } from './base-api.service';
import { User } from '../types';
import { 
  LOGIN_ENDPOINT, 
  LOGOUT_ENDPOINT, 
  PROJECTS_ENDPOINT, 
  REGISTER_ENDPOINT, 
  CHANGE_PASSWORD_ENDPOINT, 
  RESET_PASSWORD_ENDPOINT 
} from '../config/api-endpoints';

// Define interfaces for the application types
export interface ApiResponse<T = any> {
  isOk: boolean;
  data?: T;
  message?: string;
}

/**
 * Signs in a user with their email and password
 * @param email User's email address
 * @param password User's password
 * @returns ApiResponse containing User data or error message
 */
export async function signIn(email: string, password: string): Promise<ApiResponse<User>> {
  try {
    const response = await apiRequest(LOGIN_ENDPOINT, {
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

/**
 * Signs out the current user
 * @returns ApiResponse indicating success or failure
 */
export async function signOut(): Promise<ApiResponse<void>> {
  try {
    await apiRequest(LOGOUT_ENDPOINT, {
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

/**
 * Gets the currently logged-in user
 * @returns ApiResponse containing User data or error message
 */
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
      const response = await apiRequest(PROJECTS_ENDPOINT, {
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
  } catch {
    return {
      isOk: false,
      message: 'Failed to get user'
    };
  }
}

/**
 * Creates a new user account
 * @param email User's email address
 * @param password User's password
 * @param firstName User's first name (optional)
 * @param lastName User's last name (optional)
 * @returns ApiResponse indicating success or failure
 */
export async function createAccount(
  email: string, 
  password: string,
  firstName?: string,
  lastName?: string
): Promise<ApiResponse> {
  try {
    // Send the registration data to the server
    await apiRequest(REGISTER_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        firstName: firstName || '',
        lastName: lastName || ''
      })
    });
    
    // If successful, return an OK response
    return {
      isOk: true
    };
  } catch {
    // If there was an error, return a failed response
    return {
      isOk: false,
      message: 'Failed to create account'
    };
  }
}

/**
 * Changes the user's password
 * @param password New password
 * @param recoveryCode Recovery code for forgotten password (optional)
 * @param currentPassword Current password for authenticated password change (optional)
 * @returns ApiResponse indicating success or failure
 */
export async function changePassword(
  password: string,
  recoveryCode: string = '',
  currentPassword?: string
): Promise<ApiResponse> {
  try {
    const body: any = { password };
    
    // If a recovery code is provided, use it for password reset flow
    if (recoveryCode) {
      body.recoveryCode = recoveryCode;
    } else {
      // Otherwise, this is a standard password change flow
      body.currentPassword = currentPassword;
    }
    
    // Send the password change request
    await apiRequest(CHANGE_PASSWORD_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    
    return {
      isOk: true
    };
  } catch {
    return {
      isOk: false,
      message: 'Failed to change password'
    };
  }
}

/**
 * Requests a password reset for the given email
 * @param email User's email address
 * @returns ApiResponse indicating success or failure
 */
export async function resetPassword(email: string): Promise<ApiResponse> {
  try {
    // Send the reset password request
    await apiRequest(RESET_PASSWORD_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    return {
      isOk: true
    };
  } catch {
    return {
      isOk: false,
      message: 'Failed to reset password'
    };
  }
}
