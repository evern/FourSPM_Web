import React from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useDeliverableGatesCollectionController } from '../../hooks/controllers/useDeliverableGatesCollectionController';
import { deliverableGateColumns } from './deliverable-gate-columns';
import { useAuth } from '../../contexts/auth';
import { DELIVERABLE_GATES_ENDPOINT } from '@/config/api-endpoints';
import './deliverable-gates.scss';

const DeliverableGates: React.FC = () => {
  const { user } = useAuth();
  const endpoint = DELIVERABLE_GATES_ENDPOINT;
  
  const { 
    handleRowUpdating,
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow
  } = useDeliverableGatesCollectionController(user?.token, {
    endpoint,
    onUpdateError: (error) => console.error('Failed to update deliverable gate:', error)
  });

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
          onRowValidating={handleRowValidating}
          onRowRemoving={handleRowRemoving}
          onRowInserting={handleRowInserting}
        />
      </div>
    </div>
  );
};

export default DeliverableGates;
