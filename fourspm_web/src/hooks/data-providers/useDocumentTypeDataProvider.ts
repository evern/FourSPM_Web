import { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentType } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';

/**
 * Interface for document type data provider result
 */
export interface DocumentTypeDataProviderResult {
  documentTypes: DocumentType[];
  documentTypesStore: ODataStore;
  documentTypesDataSource: any; // DataSource for lookup components
  isLoading: boolean;
  error: Error | null;
  getDocumentTypeById: (id: string) => DocumentType | undefined;
  getDocumentTypeByCode: (code: string) => DocumentType | undefined;
}

/**
 * Data provider hook for document type data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the document types store, data array, loading state, and helper methods
 */
export const useDocumentTypeDataProvider = (): DocumentTypeDataProviderResult => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use the hook to get the store
  const documentTypesStore = useODataStore(DOCUMENT_TYPES_ENDPOINT);
  
  // Create a DataSource for lookups
  const documentTypesDataSource = useMemo(() => {
    return {
      store: documentTypesStore
    };
  }, [documentTypesStore]);
  
  // Load data from store on component mount
  useEffect(() => {
    setIsLoading(true);
    documentTypesStore.load()
      .then((data: DocumentType[]) => {
        setDocumentTypes(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        console.error('Error loading document types:', err);
        setError(err);
        setIsLoading(false);
      });
  }, [documentTypesStore]);
  
  /**
   * Get a document type by its ID
   * @param id The document type ID to look for
   * @returns The document type object or undefined if not found
   */
  const getDocumentTypeById = useCallback((id: string): DocumentType | undefined => {
    return documentTypes.find(docType => compareGuids(docType.guid, id));
  }, [documentTypes]);
  
  /**
   * Get a document type by its code
   * @param code The document type code to look for
   * @returns The document type object or undefined if not found
   */
  const getDocumentTypeByCode = useCallback((code: string): DocumentType | undefined => {
    return documentTypes.find(docType => docType.code === code);
  }, [documentTypes]);
  
  return {
    documentTypes,
    documentTypesStore,
    documentTypesDataSource,
    isLoading,
    error,
    getDocumentTypeById,
    getDocumentTypeByCode
  };
};
