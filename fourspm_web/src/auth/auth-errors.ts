/**
 * Standardized authentication error handling
 */

// Import necessary types
import { AuthError, InteractionRequiredAuthError } from '@azure/msal-browser';

/**
 * Authentication error categories
 */
export enum AuthErrorCategory {
  // User interaction errors
  INTERACTION_REQUIRED = 'interaction_required',
  USER_CANCELLED = 'user_cancelled',
  POPUP_BLOCKED = 'popup_blocked',
  
  // Configuration errors
  CONFIG_ERROR = 'configuration_error',
  TENANT_NOT_FOUND = 'tenant_not_found',
  
  // Network errors
  NETWORK_ERROR = 'network_error',
  SERVER_ERROR = 'server_error',
  
  // Token errors
  TOKEN_ERROR = 'token_error',
  TOKEN_EXPIRED = 'token_expired',
  
  // Permission errors
  PERMISSION_ERROR = 'permission_error',
  INSUFFICIENT_PERMISSIONS = 'insufficient_permissions',
  
  // Generic error
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Structured authentication error object
 */
export interface AuthErrorInfo {
  category: AuthErrorCategory;
  message: string;
  technicalDetails?: string;
  userAction?: string;
  originalError?: Error;
}

/**
 * Map MSAL errors to user-friendly messages
 * @param error - The original error object
 * @returns Structured error information
 */
export function mapAuthError(error: any): AuthErrorInfo {
  // Handle MSAL InteractionRequiredAuthError
  if (error instanceof InteractionRequiredAuthError) {
    return {
      category: AuthErrorCategory.INTERACTION_REQUIRED,
      message: 'Your session needs to be refreshed',
      userAction: 'Please sign in again to continue',
      technicalDetails: error.message,
      originalError: error
    };
  }
  
  // Handle other MSAL AuthErrors
  if (error instanceof AuthError) {
    // Check for specific error codes
    if (error.errorCode === 'user_cancelled') {
      return {
        category: AuthErrorCategory.USER_CANCELLED,
        message: 'Sign-in was cancelled',
        technicalDetails: error.message,
        originalError: error
      };
    }
    
    if (error.errorCode === 'popup_window_error' || error.errorCode === 'popup_blocked') {
      return {
        category: AuthErrorCategory.POPUP_BLOCKED,
        message: 'Sign-in popup was blocked',
        userAction: 'Please enable popups for this site and try again',
        technicalDetails: error.message,
        originalError: error
      };
    }
    
    if (error.errorCode?.includes('tenant')) {
      return {
        category: AuthErrorCategory.TENANT_NOT_FOUND,
        message: 'Organization account not found',
        userAction: 'Please check your email address or contact support',
        technicalDetails: error.message,
        originalError: error
      };
    }
    
    // Generic auth error
    return {
      category: AuthErrorCategory.UNKNOWN_ERROR,
      message: 'Authentication failed',
      technicalDetails: error.message,
      originalError: error
    };
  }
  
  // Handle network related errors
  if (error?.message?.includes('network') || 
      error?.message?.toLowerCase().includes('failed to fetch') ||
      error?.name === 'NetworkError') {
    return {
      category: AuthErrorCategory.NETWORK_ERROR,
      message: 'Network connection issue',
      userAction: 'Please check your internet connection and try again',
      technicalDetails: error.message,
      originalError: error
    };
  }
  
  // Server errors (5xx)
  if (error?.status >= 500 || error?.message?.includes('server')) {
    return {
      category: AuthErrorCategory.SERVER_ERROR,
      message: 'Authentication service unavailable',
      userAction: 'Please try again later or contact support',
      technicalDetails: error.message,
      originalError: error
    };
  }
  
  // Token errors
  if (error?.message?.includes('token') || 
      error?.message?.includes('expired')) {
    return {
      category: AuthErrorCategory.TOKEN_ERROR,
      message: 'Authentication session invalid',
      userAction: 'Please sign in again',
      technicalDetails: error.message,
      originalError: error
    };
  }
  
  // Permission errors
  if (error?.message?.includes('permission') || 
      error?.message?.includes('access denied') ||
      error?.message?.includes('unauthorized')) {
    return {
      category: AuthErrorCategory.PERMISSION_ERROR,
      message: 'Access denied',
      userAction: 'You may not have the necessary permissions for this action',
      technicalDetails: error.message,
      originalError: error
    };
  }
  
  // Default unknown error
  return {
    category: AuthErrorCategory.UNKNOWN_ERROR,
    message: error?.message || 'An unknown error occurred',
    technicalDetails: error?.stack || JSON.stringify(error),
    originalError: error
  };
}

/**
 * Get appropriate notification settings for auth errors
 * @param errorInfo - Structured error information
 * @returns Notification configuration
 */
export function getErrorNotificationConfig(errorInfo: AuthErrorInfo): any {
  // Determine notification type based on error category
  let type = 'error';
  let displayTime = 5000;
  
  switch (errorInfo.category) {
    case AuthErrorCategory.USER_CANCELLED:
      type = 'info';
      displayTime = 3000;
      break;
      
    case AuthErrorCategory.NETWORK_ERROR:
    case AuthErrorCategory.POPUP_BLOCKED:
      type = 'warning';
      displayTime = 6000;
      break;
      
    case AuthErrorCategory.PERMISSION_ERROR:
    case AuthErrorCategory.INSUFFICIENT_PERMISSIONS:
      type = 'error';
      displayTime = 7000;
      break;
  }
  
  // Combine user-friendly message with action if available
  const message = errorInfo.userAction 
    ? `${errorInfo.message}. ${errorInfo.userAction}` 
    : errorInfo.message;
  
  return {
    message,
    type,
    displayTime,
    position: { at: 'top center', my: 'top center' },
    shading: false,
    animation: {
      show: { type: 'fade', duration: 400, from: 0, to: 1 },
      hide: { type: 'fade', duration: 400, to: 0 }
    }
  };
}
