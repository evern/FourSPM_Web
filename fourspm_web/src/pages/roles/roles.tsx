import React, { useEffect } from 'react';
import { ODataGrid } from '../../components';
import { roleColumns } from './role-columns';
import { ROLES_ENDPOINT } from '../../config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { RolesProvider, useRoles } from '../../contexts/roles/roles-context';
import { useRoleGridHandlers } from '../../hooks/grid-handlers/useRoleGridHandlers';
import ScrollToTop from '../../components/scroll-to-top';
import './roles.scss';

/**
 * Roles component
 * 
 * Uses the Context + Reducer pattern for clean separation of view and logic.
 * This component follows the same pattern as other modules like Variations.
 */
function Roles(): React.ReactElement {
  return (
    <RolesProvider>
      <RolesContent />
    </RolesProvider>
  );
}

/**
 * Internal component that consumes the context
 * Focuses purely on rendering and delegating events to the context
 */
const RolesContent = (): React.ReactElement => {
  // Get data from our roles context
  const { 
    state: { loading, error, editorError },
  } = useRoles();

  // Use our custom grid handlers
  const {
    // Row operations
    handleRowValidating,
    handleRowInserting,
    handleRowRemoving,
    // Editor operations
    handleEditorPreparing,
    handleInitNewRow
  } = useRoleGridHandlers();
  
  // Create role columns configuration with handlers
  const roleColumnsConfig = {
    showSuccess: (message: string) => notify({
      message: `Success: ${message}`,
      type: 'success',
      displayTime: 2000,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    }),
    showError: (message: string) => notify({
      message: `Error: ${message}`,
      type: 'error',
      displayTime: 3500,
      position: {
        at: 'top center',
        my: 'top center',
        offset: '0 10'
      }
    })
  };
  
  // Display error notifications whenever errors occur
  useEffect(() => {
    // Show error notification if there is one
    if (error || editorError) {
      notify({
        message: `Error: ${error || editorError}`,
        type: 'error',
        displayTime: 3500,
        position: {
          at: 'top center',
          my: 'top center',
          offset: '0 10'
        }
      });
    }
  }, [error, editorError]);
  
  return (
    <div className="roles-container">      
            {/* Loading indicator */}
            <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">
          Roles
        </div>
        
        <ODataGrid
          title=" "
          endpoint={ROLES_ENDPOINT}
          columns={roleColumns(roleColumnsConfig)}
          keyField="guid"
          onRowValidating={handleRowValidating}
          onRowInserting={handleRowInserting}
          onRowRemoving={handleRowRemoving}
          onEditorPreparing={handleEditorPreparing}
          onInitNewRow={handleInitNewRow}
          allowAdding={true}
          allowUpdating={true}
          allowDeleting={true}
          defaultSort={[{ selector: 'displayName', desc: false }]}
          customGridHeight={900}
          countColumn="guid"
        />
      </div>
      
      <ScrollToTop />
    </div>
  );
};

export default Roles;
