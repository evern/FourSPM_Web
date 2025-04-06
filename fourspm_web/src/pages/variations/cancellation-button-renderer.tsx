import React from 'react';

interface CancellationButtonProps {
  data: any;
  onClick: (data: any) => void;
}

/**
 * Component that renders a button to cancel/remove a deliverable
 */
export const CancellationButton: React.FC<CancellationButtonProps> = ({ data, onClick }) => {
  // Determine the UI status based on available data
  const determineUiStatus = () => {
    // If it's already marked as canceled in the API
    if (data.variationStatus === 'UnapprovedCancellation' || data.variationStatus === 'ApprovedCancellation') {
      return 'Cancel';
    }
    // If it has an original deliverable GUID, it's an edited deliverable
    else if (data.originalDeliverableGuid) {
      return 'Edit';
    }
    // If it has a variation GUID but no original deliverable GUID, it's a new addition
    // This check is more reliable than just checking variationStatus
    else if (data.variationGuid && !data.originalDeliverableGuid) {
      return 'Add';
    }
    // Default to Original for standard deliverables
    else {
      return 'Original';
    }
  };
  
  const status = determineUiStatus();
  
  const getButtonLabel = () => {
    switch (status) {
      case 'Original': return 'Cancel';
      case 'Add': return 'Remove';
      case 'Edit': return 'Cancel';
      default: return 'Cancel';
    }
  };

  const getButtonHint = () => {
    switch (status) {
      case 'Original': return 'Cancel Deliverable';
      case 'Add': return 'Remove Deliverable';
      case 'Edit': return 'Cancel Deliverable';
      default: return 'Cancel Deliverable';
    }
  };

  const getButtonIcon = () => {
    switch (status) {
      case 'Original': return 'trash';
      case 'Add': return 'remove';
      case 'Edit': return 'trash';
      default: return 'trash';
    }
  };

  // Only show button if not already cancelled
  if (status === 'Cancel') {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      // Add the determined status to the data before passing to the handler
      onClick({
        ...data,
        uiStatus: status
      });
    }
  };

  return (
    <button 
      className={`dx-button dx-button-mode-contained dx-button-normal dx-icon-${getButtonIcon()}`}
      onClick={handleClick}
      title={getButtonHint()}
    >
      {getButtonLabel()}
    </button>
  );
};

/**
 * Cell renderer function for the cancellation button
 * Compatible with DevExtreme DataGrid cellRender property
 */
export const renderCancellationButton = (cellData: any, onCancellationClick: (data: any) => void) => {
  return <CancellationButton data={cellData.data} onClick={onCancellationClick} />;
};
