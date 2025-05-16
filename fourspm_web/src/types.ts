/**
 * User claim interface representing a single claim from an ID or Access token
 */
export interface UserClaim {
  type: string;
  value: string;
}

/**
 * User interface containing authentication and identity information
 */
export interface User {
  id: string;
  email: string;
  avatarUrl: string;
  token: string;
  name: string;
  claims?: UserClaim[]; // Claims extracted from the JWT token
}