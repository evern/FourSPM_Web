import React from 'react';
import { ODataGrid } from '../../components/ODataGrid/ODataGrid';
import { disciplineColumns } from './discipline-columns';
import { useAuth } from '../../contexts/auth';
import { DISCIPLINES_ENDPOINT } from '@/config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import './disciplines.scss';
import { DisciplinesProvider, useDisciplines } from '@/contexts/disciplines/disciplines-context';
import { useDisciplineGridHandlers } from '@/hooks/grid-handlers/useDisciplineGridHandlers';
import { ErrorMessage } from '@/components';

/**
 * Main Disciplines component following the Collection View Doctrine
 */
export function Disciplines(): React.ReactElement {
  return (
    <DisciplinesProvider>
      <DisciplinesContent />
    </DisciplinesProvider>
  );
}

/**
 * Internal component that uses the disciplines context
 */
const DisciplinesContent = React.memo((): React.ReactElement => {
  // Get user auth token for API calls
  const { user } = useAuth();
  
  // Use the disciplines context
  const {
    state,
    disciplinesLoading,
    disciplinesError
  } = useDisciplines();

  // Use the dedicated grid handlers hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDisciplineGridHandlers({
    userToken: user?.token
  });
  
  // Determine if we're still loading - combine context and query loading states
  const isLoading = disciplinesLoading || state.loading;
  
  // Check for errors - account for both context and query errors
  const hasError = state.error !== null || disciplinesError !== null;
  
  return (
    <div className="disciplines-container">
      {/* Loading indicator */}
      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={isLoading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      
      {/* Error message */}
      {hasError && (
        <ErrorMessage
          title="Error Loading Disciplines"
          message={state.error || (disciplinesError ? String(disciplinesError) : 'An unknown error occurred')}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Disciplines</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
            endpoint={DISCIPLINES_ENDPOINT}
            columns={disciplineColumns}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onInitialized={handleGridInitialized}
            defaultSort={[{ selector: 'code', desc: false }]}
          />
        )}
      </div>
    </div>
  );
});



export default Disciplines;
