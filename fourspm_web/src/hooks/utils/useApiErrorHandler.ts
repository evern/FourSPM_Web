import { useCallback } from 'react';
import notify from 'devextreme/ui/notify';

/**
 * Hook that provides standardized API error handling for the application
 * Handles common HTTP error codes with appropriate user messages
 */
export const useApiErrorHandler = () => {
  /**
   * Handle HTTP errors with appropriate user notifications
   * @param error - The error object from the API request
   * @param customMessages - Optional custom error messages for specific status codes
   * @returns Boolean indicating if the error was handled
   */
  const handleApiError = useCallback((error: any, customMessages?: Record<number, string>) => {
    // Extract error message from the error object
    // API errors can have the message in different places
    let errorMessage = '';
    if (error.errorDetails?.message) {
      errorMessage = error.errorDetails.message;
    } else if (error.errorDetails && typeof error.errorDetails === 'string') {
      errorMessage = error.errorDetails;
    } else if (error.message) {
      errorMessage = error.message;
    }

    const httpStatus = error.httpStatus || (error.response?.status) || 0;
    
    // Custom message for specific status code, if provided
    if (customMessages && customMessages[httpStatus]) {
      errorMessage = customMessages[httpStatus];
    }

    // Default notification config
    const notificationConfig = {
      displayTime: 3500,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      },
      width: 'auto',
      animation: {
        show: { type: 'fade', duration: 300, from: 0, to: 1 },
        hide: { type: 'fade', duration: 300, from: 1, to: 0 }
      }
    };

    // Handle validation errors (HTTP 400)
    if (httpStatus === 400) {
      notify({
        message: errorMessage || 'Cannot complete operation due to validation errors',
        type: 'error',
        ...notificationConfig
      });
      return true;
    }

    // Handle unauthorized errors (HTTP 401)
    if (httpStatus === 401) {
      // Usually handled by the authentication system, but we can show a message
      notify({
        message: errorMessage || 'Your session has expired. Please log in again.',
        type: 'warning',
        ...notificationConfig
      });
      return true;
    }

    // Handle forbidden errors (HTTP 403)
    if (httpStatus === 403) {
      notify({
        message: errorMessage || 'You do not have permission to perform this operation.',
        type: 'warning',
        ...notificationConfig
      });
      return true;
    }

    // Handle not found errors (HTTP 404)
    if (httpStatus === 404) {
      notify({
        message: errorMessage || 'The requested resource was not found.',
        type: 'warning',
        ...notificationConfig
      });
      return true;
    }

    // Handle server errors (HTTP 500+)
    if (httpStatus >= 500) {
      notify({
        message: errorMessage || 'A server error occurred. Please try again later.',
        type: 'error',
        ...notificationConfig
      });
      return true;
    }

    // Handle other errors or when status code is not available
    if (httpStatus === 0 && errorMessage) {
      notify({
        message: errorMessage,
        type: 'error',
        ...notificationConfig
      });
      return true;
    }

    // Error wasn't handled
    return false;
  }, []);

  return { handleApiError };
};
