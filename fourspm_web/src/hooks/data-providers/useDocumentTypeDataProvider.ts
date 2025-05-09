import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';
import { useODataStore } from '../../stores/odataStores';
import { DocumentType } from '../../types/odata-types';
import { compareGuids } from '../../utils/guid-utils';
import { baseApiService } from '../../api/base-api.service';

/**
 * Fetch document types data from the API
 * @returns Promise with array of document types
 */
const fetchDocumentTypes = async (): Promise<DocumentType[]> => {
  const response = await baseApiService.request(DOCUMENT_TYPES_ENDPOINT);
  const data = await response.json();
  return data.value || [];
};

/**
 * Interface for document type data provider result
 */
export interface DocumentTypeDataProviderResult {
  documentTypes: DocumentType[];
  documentTypesStore: any;
  documentTypesDataSource: any;
  isLoading: boolean;
  error: Error | null;
  getDocumentTypeById: (id: string) => DocumentType | undefined;
  getDocumentTypeByCode: (code: string) => DocumentType | undefined;
  refetch: () => Promise<any>;
}

/**
 * Data provider hook for document type data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the document types store, data array, loading state, and helper methods
 */
export const useDocumentTypeDataProvider = (shouldLoad: boolean | undefined = true): DocumentTypeDataProviderResult => {
  // Create a store for OData operations
  const documentTypesStore = useODataStore(DOCUMENT_TYPES_ENDPOINT, 'guid');
  
  // Use React Query to fetch and cache document types
  const { 
    data: documentTypes = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: fetchDocumentTypes
  });
  
  const error = queryError as Error | null;
  
  /**
   * Create a custom data source for DevExtreme compatibility
   */
  const documentTypesDataSource = useMemo(() => ({
    load: () => {
      if (documentTypes.length === 0 && !isLoading) {
        refetch();
      }
      return Promise.resolve(documentTypes);
    },
    byKey: (key: string) => {
      const foundItem = documentTypes.find(documentType => compareGuids(documentType.guid, key));
      return Promise.resolve(foundItem || null);
    }
  }), [documentTypes, isLoading, refetch]);

  /**
   * Get a document type by ID
   */
  const getDocumentTypeById = useCallback((id: string): DocumentType | undefined => {
    if (!id) return undefined;
    return documentTypes.find(documentType => compareGuids(documentType.guid, id));
  }, [documentTypes]);

  /**
   * Get a document type by code
   * @param code The document type code to look for
   * @returns The document type object or undefined if not found
   */
  const getDocumentTypeByCode = useCallback((code: string): DocumentType | undefined => {
    return documentTypes.find(documentType => documentType.code === code);
  }, [documentTypes]);

  return {
    documentTypes,
    documentTypesStore,
    documentTypesDataSource,
    isLoading,
    error,
    getDocumentTypeById,
    getDocumentTypeByCode,
    refetch
  };
};
