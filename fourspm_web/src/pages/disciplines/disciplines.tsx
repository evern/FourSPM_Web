import React, { useEffect, useRef } from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { useDisciplineCollectionController } from '../../hooks/controllers/useDisciplineCollectionController';
import { disciplineColumns } from './discipline-columns';
import { useAuth } from '../../contexts/auth';
import { DISCIPLINES_ENDPOINT } from '@/config/api-endpoints';
import './disciplines.scss';

const Disciplines: React.FC = () => {
  console.log('Disciplines rendering');
  
  // Use a ref to track mount/render counts
  const renderCountRef = useRef(0);
  const mountCountRef = useRef(0);

  // Track component mounting
  useEffect(() => {
    mountCountRef.current += 1;
    console.log(`Disciplines mounted (mount count: ${mountCountRef.current})`);
    
    return () => {
      console.log('Disciplines unmounting');
    };
  }, []);

  // Track all renders
  renderCountRef.current += 1;
  console.log(`Disciplines render count: ${renderCountRef.current}`);
  
  // Log auth context changes to track if they're causing re-renders
  const { user } = useAuth();
  console.log('Auth context user token in Disciplines:', user?.token ? 'exists' : 'none');
  const endpoint = DISCIPLINES_ENDPOINT;
  
  // Use the enhanced useDisciplineData hook with integrated grid operations and validation
  const { 
    handleRowUpdating, 
    handleRowRemoving,
    handleRowInserting,
    handleRowValidating,
    handleInitNewRow
  } = useDisciplineCollectionController(user?.token, {
    endpoint,
    onDeleteError: (error) => console.error('Failed to delete discipline:', error),
    onUpdateError: (error) => console.error('Failed to update discipline:', error)
  });

  return (
    <div className="disciplines-container">
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Disciplines</div>
        <ODataGrid
          title=" "
          endpoint={endpoint}
          columns={disciplineColumns}
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

export default Disciplines;
