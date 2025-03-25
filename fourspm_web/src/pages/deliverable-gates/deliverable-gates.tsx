import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useDeliverableGatesController } from '../../hooks/controllers/useDeliverableGatesController';
import { deliverableGateColumns } from './deliverable-gate-columns';
import { useAuth } from '../../contexts/auth';
import './deliverable-gates.scss';

const DeliverableGates: React.FC = () => {
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/DeliverableGates`;
  
  // Use the enhanced useDeliverableGates hook with integrated grid operations and validation
  const { 
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting,
    onRowValidating
  } = useDeliverableGatesController(user?.token, {
    endpoint,
    onUpdateError: (error) => console.error('Failed to update discipline:', error)
  });

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      name: '',
      maxPercentage: 1,
      autoPercentage: 0
    };
  };

  return (
    <div className="deliverable-gates-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Deliverable Gates</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={deliverableGateColumns}
          keyField="guid"
          onRowUpdating={handleRowUpdating}
          onInitNewRow={handleInitNewRow}
          onRowValidating={onRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default DeliverableGates;
