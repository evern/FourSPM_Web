import React, { useCallback, useEffect } from 'react';
import { ODataGrid } from '../../components';
import { documentTypeColumns } from './document-type-columns';

import { DOCUMENT_TYPES_ENDPOINT } from '@/config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import './document-types.scss';
import { DocumentTypesProvider, useDocumentTypes } from '@/contexts/document-types/document-types-context';

import { useDocumentTypeGridHandlers } from '@/hooks/grid-handlers/useDocumentTypeGridHandlers';
import { ErrorMessage } from '@/components';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { showReadOnlyNotification } from '../../utils/permission-utils';
import { PERMISSIONS } from '../../constants/permissions';

// Main DocumentTypes component following the Collection View Doctrine
export function DocumentTypes(): React.ReactElement {
  return (
    <DocumentTypesProvider>
      <DocumentTypesContent />
    </DocumentTypesProvider>
  );
}

// Internal component that uses the document types context
const DocumentTypesContent = React.memo((): React.ReactElement => {
  // Use the document types context
  const {
    state: { loading, error },
    documentTypesLoading,
    documentTypesError,
    isLookupDataLoading
  } = useDocumentTypes();

  // Use the permission check hook for proper permission checking
  const { canEdit, loadPermissions, loading: permissionsLoading } = usePermissionCheck();
  
  // Load permissions when component mounts
  useEffect(() => {
    // Ensure permissions are loaded
    loadPermissions();
  }, [loadPermissions]);
  
  // Function to check document type edit permissions
  const canEditDocumentTypes = useCallback(() => {
    return canEdit(PERMISSIONS.DOCUMENT_TYPES.EDIT.split('.')[0]); // Extract 'document-types' from 'document-types.edit'
  }, [canEdit]);
  
  // Show read-only notification on component mount if needed
  useEffect(() => {
    // Only show notification when both permissions and data are fully loaded
    if (!canEditDocumentTypes() && !loading && !permissionsLoading) {
      showReadOnlyNotification('document types');
    }
  }, [canEditDocumentTypes, loading, permissionsLoading]);



  // Use the dedicated grid handlers hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDocumentTypeGridHandlers();
  
  // Determine if we're still loading - combine all loading states including project loading
  const isLoading = isLookupDataLoading || documentTypesLoading || loading;
  
  // Check for errors - account for both context and query errors
  const hasError = error !== null || documentTypesError !== null;
  
  // Create a consistent title for display and export
  const gridTitle = 'Document Types';

  return (
    <div className="document-types-container">

      <LoadPanel
        position={{ of: '.app-main-content' }}
        visible={isLoading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0,0,0,0.1)"
        showPane={true}
      />
      

      {hasError && (
        <ErrorMessage
          title="Error Loading Document Types"
          message={error || (documentTypesError ? String(documentTypesError) : 'An unknown error occurred')}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">{gridTitle}</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
            exportFileName={gridTitle}
            endpoint={DOCUMENT_TYPES_ENDPOINT}
            columns={documentTypeColumns}
            keyField="guid"
            onRowUpdating={handleRowUpdating}
            onInitNewRow={handleInitNewRow}
            onRowValidating={handleRowValidating}
            onRowRemoving={handleRowRemoving}
            onRowInserting={handleRowInserting}
            onInitialized={handleGridInitialized}
            defaultSort={[{ selector: 'code', desc: false }]}
            customGridHeight={900}
            allowAdding={canEditDocumentTypes()}
            allowUpdating={canEditDocumentTypes()}
            allowDeleting={canEditDocumentTypes()}
          />
        )}
      </div>
    </div>
  );
});

export default DocumentTypes;
