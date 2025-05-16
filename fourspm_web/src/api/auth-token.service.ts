/**
 * Authentication token service for managing JSON Web Tokens (JWT)
 * Following the FourSPM UI Development Guidelines and API standardization patterns
 */

/**
 * Interface representing the parsed JWT token structure
 */
export interface JwtToken {
  /** Raw JWT token string */
  raw: string;
  /** Decoded header section */
  header: any;
  /** Decoded payload section */
  payload: any;
  /** Token expiration timestamp */
  expiresAt: number;
}

/**
 * Parses a JWT token into its components
 * @param token The raw JWT token string
 * @returns Parsed token with header, payload, and expiration
 */
export const parseJwtToken = (token: string): JwtToken | null => {
  if (!token) return null;

  try {
    // JWT tokens have three parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode header and payload (Base64 URL encoded)
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Extract expiration time
    const expiresAt = payload.exp ? payload.exp * 1000 : 0; // Convert to milliseconds

    return {
      raw: token,
      header,
      payload,
      expiresAt
    };
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
};

/**
 * Checks if a token has expired
 * @param token The parsed JWT token
 * @returns True if the token has expired, false otherwise
 */
export const isTokenExpired = (token: JwtToken | null): boolean => {
  if (!token) return true;
  return Date.now() >= token.expiresAt;
};

/**
 * Extracts claims from a JWT token
 * @param token The parsed JWT token
 * @returns Array of user claims in a standardized format
 */
export const extractClaims = (token: JwtToken | null): { type: string; value: string }[] => {
  if (!token || !token.payload) return [];

  const claims: { type: string; value: string }[] = [];
  
  // Extract claims from the token payload
  Object.entries(token.payload).forEach(([key, value]) => {
    // Ignore standard JWT claims
    if (['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'].includes(key)) {
      return;
    }

    // Handle array values (like roles or groups)
    if (Array.isArray(value)) {
      value.forEach((v) => {
        claims.push({ type: key, value: String(v) });
      });
    } else {
      claims.push({ type: key, value: String(value) });
    }
  });

  return claims;
};

/**
 * Extracts roles from a JWT token
 * @param token The parsed JWT token
 * @returns Array of role names
 */
export const extractRoles = (token: JwtToken | null): string[] => {
  if (!token || !token.payload) return [];

  // Check different possible role claim names used by Azure AD
  const roleClaimKeys = [
    'roles',
    'role', 
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'wids',
    'groups'
  ];

  const roles: string[] = [];

  for (const key of roleClaimKeys) {
    const roleClaim = token.payload[key];
    if (roleClaim) {
      if (Array.isArray(roleClaim)) {
        roles.push(...roleClaim.map(r => String(r)));
      } else {
        roles.push(String(roleClaim));
      }
    }
  }

  // Convert Set to Array to avoid TS iteration issues
  const uniqueRoles = Array.from(new Set(roles));
  return uniqueRoles; // Return deduplicated roles
};

/**
 * Gets the stored token from localStorage
 * @returns The raw JWT token string or null if not found
 */
export const getStoredToken = (): string | null => {
  try {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    const user = JSON.parse(userJson);
    return user.token || null;
  } catch (error) {
    console.error('Failed to get stored token:', error);
    return null;
  }
};

/**
 * Gets the parsed JWT token from localStorage
 * @returns The parsed JWT token or null if not found or invalid
 */
export const getParsedToken = (): JwtToken | null => {
  const token = getStoredToken();
  if (!token) return null;
  
  return parseJwtToken(token);
};

/**
 * Stores a token in localStorage within the user object
 * @param token The JWT token string
 * @param userData Additional user data to store
 */
export const storeToken = (token: string, userData: any = {}): void => {
  try {
    const userObject = {
      ...userData,
      token
    };
    localStorage.setItem('user', JSON.stringify(userObject));
  } catch (error) {
    console.error('Failed to store token:', error);
  }
};

/**
 * Removes the token and user data from localStorage
 */
export const removeToken = (): void => {
  try {
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Failed to remove token:', error);
  }
};
