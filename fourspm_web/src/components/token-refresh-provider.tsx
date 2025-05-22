import React, { PropsWithChildren, ReactElement } from 'react';
import { useTokenRefresh } from '../hooks/use-token-refresh';

/**
 * Provider component for automatic token refresh
 * 
 * This component should be placed high in the component tree (e.g., wrapping App or Layout)
 * to ensure tokens are automatically refreshed before they expire.
 * 
 * Following the FourSPM UI Development Guidelines:
 * - Simple component with clear responsibility
 * - No UI rendering, only functional behavior
 * - Follows the provider pattern for app-wide functionality
 * 
 * @param props Component props with children
 * @returns The wrapped children with token refresh capability
 */
export const TokenRefreshProvider = ({ 
  children,
  bufferSeconds = 300 // Default 5 minutes
}: PropsWithChildren<{
  bufferSeconds?: number
}>): ReactElement => {
  // Initialize the token refresh hook
  useTokenRefresh(bufferSeconds);
  
  // Simply render children - no UI impact
  return <>{children}</>;
};
