import React from 'react';
import { API_CONFIG } from '../../config/api';
import { v4 as uuidv4 } from 'uuid';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useGridValidation, ValidationRule } from '../../hooks/useGridValidation';
import { useGridOperations } from '../../hooks/useGridOperations';
import { deliverableGateColumns } from './deliverable-gate-columns';
import { useAuth } from '../../contexts/auth';
import './deliverable-gates.scss';

const DeliverableGates: React.FC = () => {
  const { user } = useAuth();
  const endpoint = `${API_CONFIG.baseUrl}/odata/v1/DeliverableGates`;
  
  console.log('DeliverableGates Component - Initial Render:', {
    endpoint,
    hasToken: !!user?.token
  });

  const { handleRowUpdating } = useGridOperations({
    endpoint,
    onUpdateError: (error) => console.error('Failed to update discipline:', error)
  });

  // Define standard validation rules
  const validationRules: ValidationRule[] = [
    { 
      field: 'name', 
      required: true, 
      maxLength: 100,
      errorText: 'Name cannot exceed 100 characters' 
    },
    { 
      field: 'maxPercentage', 
      required: true, 
      errorText: 'Max percentage is required' 
    }
  ];

  // Create standard validation handler
  const standardValidation = useGridValidation(validationRules);

  // Custom row validation function to check if auto percentage exceeds max percentage
  const handleRowValidating = (e: any) => {
    // Run the standard validations first
    standardValidation(e);
    
    // If standard validation fails, return early
    if (!e.isValid) {
      return;
    }

    // Additional validation: autoPercentage shouldn't exceed maxPercentage
    const maxPercentage = e.newData.maxPercentage !== undefined 
      ? e.newData.maxPercentage 
      : e.oldData.maxPercentage;

    const autoPercentage = e.newData.autoPercentage !== undefined 
      ? e.newData.autoPercentage 
      : e.oldData.autoPercentage;

    if (autoPercentage > maxPercentage) {
      e.isValid = false;
      e.errorText = 'Auto percentage cannot exceed max percentage';
    }
  };

  const handleInitNewRow = (e: any) => {
    e.data = {
      guid: uuidv4(),
      name: '',
      maxPercentage: 0.0,  // Make sure it's a number
      autoPercentage: 0.0 // Make sure it's a number
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
          onInitNewRow={handleInitNewRow}
          onRowValidating={handleRowValidating}
        />
      </div>
    </div>
  );
};

export default DeliverableGates;
