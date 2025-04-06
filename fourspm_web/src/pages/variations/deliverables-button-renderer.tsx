import React from 'react';

/**
 * Component that renders a button to navigate to the variation deliverables page
 */
export const DeliverablesButton: React.FC<{ data: any }> = ({ data }) => {
  const handleClick = () => {
    // Navigate to the variation deliverables component
    window.location.href = `#/variations/${data.guid}/deliverables`;
  };

  return (
    <button 
      className="dx-button dx-button-mode-contained dx-button-normal"
      onClick={handleClick}
    >
      View Deliverables
    </button>
  );
};

/**
 * Cell renderer function for the deliverables button
 * Compatible with DevExtreme DataGrid cellRender property
 */
export const renderDeliverablesButton = (cellData: any) => {
  return <DeliverablesButton data={cellData.data} />;
};
