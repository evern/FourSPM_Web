/**
 * Token Utilities for JWT Token Handling
 * Following the FourSPM UI Development Guidelines
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
  
  // Add a small buffer (30 seconds) to account for clock skew
  const bufferMs = 30 * 1000;
  return Date.now() >= (token.expiresAt - bufferMs);
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

  // Return deduplicated roles
  return Array.from(new Set(roles));
};
