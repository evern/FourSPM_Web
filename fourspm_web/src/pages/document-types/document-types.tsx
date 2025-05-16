import React from 'react';
import { ODataGrid } from '../../components';
import { documentTypeColumns } from './document-type-columns';
import { useAuth } from '../../auth';
import { DOCUMENT_TYPES_ENDPOINT } from '@/config/api-endpoints';
import { LoadPanel } from 'devextreme-react/load-panel';
import './document-types.scss';
import { DocumentTypesProvider, useDocumentTypes } from '@/contexts/document-types/document-types-context';
import { useDocumentTypeGridHandlers } from '@/hooks/grid-handlers/useDocumentTypeGridHandlers';
import { ErrorMessage } from '@/components';

/**
 * Main DocumentTypes component following the Collection View Doctrine
 */
export function DocumentTypes(): React.ReactElement {
  return (
    <DocumentTypesProvider>
      <DocumentTypesContent />
    </DocumentTypesProvider>
  );
}

/**
 * Internal component that uses the document types context
 */
const DocumentTypesContent = React.memo((): React.ReactElement => {
  // Get user auth token for API calls
  const { user } = useAuth();
  
  // Use the document types context
  const {
    state,
    documentTypesLoading,
    documentTypesError,
    isLookupDataLoading
  } = useDocumentTypes();

  // Use the dedicated grid handlers hook
  const { 
    handleRowValidating,
    handleRowUpdating,
    handleRowInserting,
    handleRowRemoving,
    handleInitNewRow,
    handleGridInitialized
  } = useDocumentTypeGridHandlers({
    userToken: user?.token
  });
  
  // Determine if we're still loading - combine all loading states including project loading
  const isLoading = isLookupDataLoading || documentTypesLoading || state.loading;
  
  // Check for errors - account for both context and query errors
  const hasError = state.error !== null || documentTypesError !== null;
  
  return (
    <div className="document-types-container">
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
          title="Error Loading Document Types"
          message={state.error || (documentTypesError ? String(documentTypesError) : 'An unknown error occurred')}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Document Types</div>
        {!isLoading && !hasError && (
          <ODataGrid
            title=" "
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
          />
        )}
      </div>
    </div>
  );
});

export default DocumentTypes;
