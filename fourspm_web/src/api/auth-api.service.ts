import { apiRequest } from './base-api.service';
import { User, UserClaim } from '../types';
import { extractClaims, getParsedToken, parseJwtToken } from './auth-token.service';
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
 * Signs in a user with their email and password or Azure AD token
 * @param email User's email address (or empty for token authentication)
 * @param password User's password (or empty for token authentication)
 * @param azureToken Optional Azure AD token from MSAL authentication
 * @returns ApiResponse containing User data or error message
 */
export async function signIn(email: string, password: string, azureToken?: string): Promise<ApiResponse<User>> {
  try {
    // If an Azure AD token is provided, use it directly
    if (azureToken) {
      // Parse the token to extract claims
      const parsedToken = parseJwtToken(azureToken);
      if (!parsedToken) {
        return {
          isOk: false,
          message: "Invalid Azure AD token"
        };
      }

      // Extract user information from the token
      const claims = extractClaims(parsedToken);
      const payload = parsedToken.payload;
      
      // Create user object from token claims
      const user: User = {
        id: payload.oid || payload.sub || '',
        email: payload.email || payload.upn || '',
        name: payload.name || '',
        token: azureToken,
        avatarUrl: '',  // Azure AD doesn't provide avatar in token
        claims: claims
      };
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      return {
        isOk: true,
        data: user,
      };
    } else {
      // Normal username/password flow
      const response = await apiRequest(LOGIN_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      // Create a default user object
      const user: User = {
        id: data.id || 'user-id',
        token: data.token,
        email: email,
        name: data.name || email.split('@')[0],
        avatarUrl: data.avatarUrl || ''
      };
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      return {
        isOk: true,
        data: user,
      };
    }
  }
  catch (error) {
    console.error('Authentication error:', error);
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
    
    // Check if we have a token and parse it
    const token = user.token;
    if (!token) {
      localStorage.removeItem('user');
      return {
        isOk: false,
        message: 'Invalid user data: no token'
      };
    }
    
    // Parse token and validate it
    const parsedToken = parseJwtToken(token);
    if (!parsedToken || Date.now() >= parsedToken.expiresAt) {
      // Token is expired
      localStorage.removeItem('user');
      return {
        isOk: false,
        message: 'Token expired'
      };
    }
    
    // Ensure user has claims
    if (!user.claims) {
      // Extract claims from token if not already present
      user.claims = extractClaims(parsedToken);
      localStorage.setItem('user', JSON.stringify(user));
    }

    // Validate token with a backend request
    try {
      const response = await apiRequest(PROJECTS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return {
          isOk: true,
          data: user
        };
      } else {
        // Token is invalid (server rejected it)
        localStorage.removeItem('user');
        return {
          isOk: false,
          message: 'Token rejected by server'
        };
      }
    } catch (error) {
      // Network or other error
      console.error('Token validation error:', error);
      return {
        isOk: false,
        message: 'Failed to validate token'
      };
    }
  } catch (error) {
    console.error('User retrieval error:', error);
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
