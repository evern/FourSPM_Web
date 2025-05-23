import React, { useState, useEffect } from 'react';
import { ODataGrid } from '../../components';
import { disciplineColumns } from './discipline-columns';
import { DISCIPLINES_ENDPOINT } from '@/config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import './disciplines.scss';
import { DisciplinesProvider, useDisciplines } from '@/contexts/disciplines/disciplines-context';
import { useDisciplineGridHandlers } from '@/hooks/grid-handlers/useDisciplineGridHandlers';
import { ErrorMessage } from '@/components';
// Import getToken for direct access to token
import { getToken } from '@/utils/token-store';

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
    state: { loading: contextLoading, error: contextError },
    disciplinesLoading,
    disciplinesError
  } = useDisciplines();

  // Use the dedicated grid handlers hook - token access happens directly in handlers
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDisciplineGridHandlers({});
  
  // Determine if we're still loading - combine context and query loading states
  const isLoading = disciplinesLoading || contextLoading;
  
  // Check for errors - account for both context and query errors
  const hasError = contextError !== null || disciplinesError !== null;
  
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
          message={contextError || (disciplinesError ? String(disciplinesError) : 'An unknown error occurred')}
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
            customGridHeight={900}
          />
        )}
      </div>
    </div>
  );
});



export default Disciplines;
