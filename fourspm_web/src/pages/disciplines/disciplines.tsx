import React, { useState, useEffect } from 'react';
import { ODataGrid } from '../../components';
import { disciplineColumns } from './discipline-columns';
// Token management is now handled by the DisciplinesContext
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
    state: { token, loading: tokenLoading, error: tokenError },
    disciplinesLoading,
    disciplinesError,
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
    acquireToken: () => Promise.resolve(token || '')
  });
  
  // Determine if we're still loading - combine context and query loading states
  const isLoading = disciplinesLoading || tokenLoading;
  
  // Check for errors - account for both context and query errors
  const hasError = tokenError !== null || disciplinesError !== null;
  
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
          message={tokenError || (disciplinesError ? String(disciplinesError) : 'An unknown error occurred')}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Disciplines</div>
        {!isLoading && !hasError && token && (
          <ODataGrid
            title=" "
            endpoint={DISCIPLINES_ENDPOINT}
            columns={disciplineColumns}
            keyField="guid"
            token={token}
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
        {!isLoading && !hasError && !token && (
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
