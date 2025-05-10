import React from 'react';

interface ErrorMessageProps {
  /** Title of the error message */
  title: string;
  /** Error message to display */
  message: string | null;
  /** Optional callback for retry button - if not provided, reloads the page */
  onRetry?: () => void;
}

/**
 * Reusable error message component for displaying error alerts
 * Used across collection views and other components
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  title, 
  message, 
  onRetry 
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="dx-card alert alert-danger m-3">
      <div className="d-flex">
        <div className="mr-3">
          <i className="dx-icon-warning" />
        </div>
        <div className="flex-grow-1">
          <h5>{title}</h5>
          <p>{message}</p>
        </div>
        <div>
          <button 
            className="btn btn-outline-danger btn-sm" 
            onClick={handleRetry}
          >
            <i className="dx-icon-refresh" /> Retry
          </button>
        </div>
      </div>
    </div>
  );
};
