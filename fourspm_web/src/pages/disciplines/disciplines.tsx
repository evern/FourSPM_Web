import React, { useState, useEffect } from 'react';
import { ODataGrid } from '../../components';
import { disciplineColumns } from './discipline-columns';
import { useMSALAuth } from '../../contexts/msal-auth';
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
  // No longer need local token state or direct MSAL access
  
  // Use the disciplines context
  const {
    state,
    disciplinesLoading,
    disciplinesError,
    acquireToken // Use acquireToken from context
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
    acquireToken
  });
  
  // No longer need to acquire token manually as it's handled by the context
  
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
        {!isLoading && !hasError && state.token && (
          <ODataGrid
            title=" "
            endpoint={DISCIPLINES_ENDPOINT}
            columns={disciplineColumns}
            keyField="guid"
            token={state.token} // Pass the token from context
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onInitialized={handleGridInitialized}
            defaultSort={[{ selector: 'code', desc: false }]}
            customGridHeight={900}
          />
        )}
        {!isLoading && !hasError && !state.token && (
          <ErrorMessage
            title="Authentication Error"
            message="Unable to acquire authentication token. Please try refreshing the page."
          />
        )}
      </div>
    </div>
  );
});



export default Disciplines;
