import { useQuery } from '@tanstack/react-query';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';
import { useODataStore } from '../../stores/odataStores';
import { DocumentType } from '../../types/odata-types';
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
  isLoading: boolean;
  error: Error | null;
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
  
  return {
    documentTypes,
    documentTypesStore,
    isLoading,
    error,
    refetch
  };
};
