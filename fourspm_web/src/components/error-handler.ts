/**
 * Central error handling for the application
 * Handles DevExtreme and API errors with user-friendly notifications
 */

import notify from 'devextreme/ui/notify';

/**
 * Standard notification configuration
 */
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

/**
 * Custom styling for different notification types
 */
const notificationStyles = {
  error: {
    color: '#ffffff',
    backgroundColor: '#d9534f',
    borderColor: '#d43f3a'
  },
  warning: {
    color: '#000000',
    backgroundColor: '#ffeb3b',
    borderColor: '#fbc02d'
  },
  success: {
    color: '#ffffff',
    backgroundColor: '#4caf50',
    borderColor: '#43a047'
  },
  info: {
    color: '#ffffff',
    backgroundColor: '#2196f3',
    borderColor: '#1e88e5'
  }
};

/**
 * Global error handler for DevExtreme components
 * @param error - Error object from DevExtreme
 * @param customMessages - Optional custom messages for specific error codes
 */
export function errorHandler(error: any, customMessages?: Record<number, string>): boolean {
  // Extract error message from the error object
  let errorMessage = '';
  let httpStatus = 0;
  
  // Handle xhr error objects
  if (error.xhr) {
    httpStatus = error.xhr.status;
    try {
      if (error.xhr.responseText) {
        const response = JSON.parse(error.xhr.responseText);
        errorMessage = response.message || response.error || response.Message || '';
      }
    } catch (e) {
      errorMessage = error.xhr.responseText || '';
    }
  } 
  // Handle DevExtreme error objects
  else if (error.httpStatus) {
    httpStatus = error.httpStatus;
    if (error.errorDetails?.message) {
      errorMessage = error.errorDetails.message;
    } else if (error.errorDetails && typeof error.errorDetails === 'string') {
      errorMessage = error.errorDetails;
    } else if (error.message) {
      errorMessage = error.message;
    }
  }
  
  // Use custom message if provided for this status code
  if (customMessages && customMessages[httpStatus]) {
    errorMessage = customMessages[httpStatus];
  }
  
  // Handle specific HTTP status codes with appropriate messages
  switch (httpStatus) {
    case 400: // Bad Request
      notify({
        message: errorMessage || 'Cannot complete operation due to validation errors',
        type: 'error',
        ...notificationConfig,
        ...notificationStyles.error
      });
      return true;
      
    case 401: // Unauthorized
      notify({
        message: errorMessage || 'Your session has expired. Please log in again.',
        type: 'warning',
        ...notificationConfig,
        ...notificationStyles.warning
      });
      return true;
      
    case 403: // Forbidden
      notify({
        message: errorMessage || 'You do not have permission to perform this operation.',
        type: 'error',
        ...notificationConfig,
        ...notificationStyles.error
      });
      return true;
      
    case 404: // Not Found
      notify({
        message: errorMessage || 'The requested resource was not found.',
        type: 'warning',
        ...notificationConfig,
        ...notificationStyles.warning
      });
      return true;
      
    default:
      // Server errors (500+)
      if (httpStatus >= 500) {
        notify({
          message: errorMessage || 'A server error occurred. Please try again later.',
          type: 'error',
          ...notificationConfig,
          ...notificationStyles.error
        });
        return true;
      }
      
      // Other errors with a message
      if (errorMessage) {
        notify({
          message: errorMessage,
          type: 'error',
          ...notificationConfig
        });
        return true;
      }
      
      // Error wasn't handled specifically
      return false;
  }
}
