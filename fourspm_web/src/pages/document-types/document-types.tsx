import React from 'react';
import { ODataGrid } from '../../components';
import { documentTypeColumns } from './document-type-columns';
// Token management is now handled by the DocumentTypesContext
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
  // Use the document types context
  const {
    state: { token, loading: tokenLoading, error: tokenError },
    documentTypesLoading,
    documentTypesError,
    isLookupDataLoading,
    acquireToken
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
    acquireToken: () => Promise.resolve(token || '')
  });
  
  // Determine if we're still loading - combine all loading states including project loading
  const isLoading = isLookupDataLoading || documentTypesLoading || tokenLoading;
  
  // Check for errors - account for both context and query errors
  const hasError = tokenError !== null || documentTypesError !== null;
  
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
          message={tokenError || (documentTypesError ? String(documentTypesError) : 'An unknown error occurred')}
        />
      )}
      
      <div className="custom-grid-wrapper">
        <div className="grid-custom-title">Document Types</div>
        {!isLoading && !hasError && token && (
          <ODataGrid
            title=" "
            endpoint={DOCUMENT_TYPES_ENDPOINT}
            columns={documentTypeColumns}
            keyField="guid"
            token={token}
            onTokenExpired={acquireToken}
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

export default DocumentTypes;
