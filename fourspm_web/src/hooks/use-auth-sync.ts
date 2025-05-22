/**
 * This hook provides a way to synchronize authentication state between components
 * It solves the race condition between token initialization and navigation
 */
import { useEffect, useRef } from 'react';
import { useToken } from '../contexts/token-context';
import { getToken } from '../utils/token-store';

/**
 * Use this hook in components that depend on authentication state
 * but may experience race conditions during initialization
 * 
 * It follows the pattern established in our app for handling auth state race conditions
 * by delaying dependent operations until auth is properly established
 */
export const useAuthSync = (onAuthenticated: () => void) => {
  const { token } = useToken();
  const initialized = useRef(false);
  
  useEffect(() => {
    // Skip if already handled
    if (initialized.current) return;
    
    // If we have a token in context, use it
    if (token) {
      // Add small delay to ensure token provider is registered first
      // This follows our established pattern for auth race conditions
      setTimeout(() => {
        initialized.current = true;
        onAuthenticated();
      }, 100); // Small delay to ensure token propagation
      return;
    }
    
    // Fallback: check token store directly
    const storeToken = getToken();
    if (storeToken) {
      // Token exists in store but not in context yet
      // Use a slightly longer delay to allow context to sync
      setTimeout(() => {
        initialized.current = true;
        onAuthenticated();
      }, 150);
    }
  }, [token, onAuthenticated]);
};
