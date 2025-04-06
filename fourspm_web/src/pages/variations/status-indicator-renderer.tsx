import React from 'react';

interface StatusIndicatorProps {
  data: any;
}

/**
 * Component that renders a status indicator with color coding
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ data }) => {
  // Determine status based on data properties if uiStatus isn't directly available
  const determineUiStatus = () => {
    if (data.uiStatus) {
      return data.uiStatus;
    }
    
    // If uiStatus is not available, determine it from other properties
    if (data.variationStatus === 'UnapprovedCancellation' || data.variationStatus === 'ApprovedCancellation') {
      return 'Cancel';
    } else if (data.originalDeliverableGuid) {
      return 'Edit';
    } else if (data.variationGuid && !data.originalDeliverableGuid) {
      return 'Add';
    } else {
      return 'Original';
    }
  };
  
  const status = determineUiStatus();
  
  // Define status colors
  const statusColors = {
    'Original': '#808080', // Gray
    'Add': '#337ab7',      // Blue
    'Edit': '#5cb85c',     // Green
    'Cancel': '#d9534f'    // Red
  };
  
  const color = statusColors[status] || '#808080';
  
  return (
    <div className="variation-status-indicator" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <div 
        style={{
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: color, 
          marginRight: '8px'
        }}
      />
      <span>{status}</span>
    </div>
  );
};

/**
 * Cell renderer function for the status indicator
 * Compatible with DevExtreme DataGrid cellRender property
 */
export const renderStatusIndicator = (cellData: any) => {
  return <StatusIndicator data={cellData.data} />;
};
