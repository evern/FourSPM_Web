import { AccountInfo } from '@azure/msal-browser';

/**
 * User information including MSAL authentication details and role-based access
 */
export interface User {
  /** User's email address */
  email: string;
  
  /** User's display name */
  displayName?: string;
  
  /** User's access token for API requests */
  token: string;
  
  /** Array of role names assigned to the user in Azure AD */
  roles: string[];
  
  /** MSAL account information */
  account?: AccountInfo;
  
  /** Timestamp (ms) when the token expires */
  tokenExpiresAt?: number;
}

/**
 * Authentication context state and methods
 */
export interface AuthContextType {
  /** Current user information */
  user?: User;
  
  /** Whether authentication is in progress */
  loading: boolean;
  
  /** Error message if authentication fails */
  error?: Error | null;
  
  /** Function to sign in the user via MSAL */
  signIn: () => Promise<ApiResponse<User>>;
  
  /** Function to sign out the user and clear session */
  signOut: () => Promise<void>;
  
  /**
   * Checks if the current user has the specified role
   * @param role The role to check
   * @returns True if the user has the role, false otherwise
   */
  hasRole: (role: string) => boolean;
}

/**
 * Response format for authentication API calls
 */
/**
 * Standard API response structure with enhanced error details
 */
export interface ApiResponse<T = any> {
  isOk: boolean;
  data?: T;
  message?: string;
  errorDetails?: {
    category?: string;
    technicalDetails?: string;
    code?: string;
  };
}
