/**
 * Utility function to get authentication headers for API requests
 * 
 * @param token Optional authentication token
 * @returns Object with Authorization header if token is provided
 */
export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}
