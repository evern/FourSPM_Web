import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';
import { DocumentType } from '../../types/odata-types';
import { baseApiService } from '../../api/base-api.service';
import { useToken } from '../../contexts/token-context';

/**
 * Fetch document types data from the API
 * @param token Authentication token
 * @returns Promise with array of document types
 */
const fetchDocumentTypes = async (token?: string): Promise<DocumentType[]> => {
  // Ensure we have a valid API request configuration
  const requestOptions = {
    method: 'GET'
  } as any;
  
  // Add token if available
  if (token) {
    requestOptions.token = token;
  } else {
    console.warn('fetchDocumentTypes: No token provided, request may fail');
  }
  
  const response = await baseApiService.request(DOCUMENT_TYPES_ENDPOINT, requestOptions);
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
  // Get token from the TokenContext
  const { token } = useToken();
  
  // Create a store for OData operations with token
  const documentTypesStore = useODataStore(DOCUMENT_TYPES_ENDPOINT, 'guid', {
    token // Pass token to ODataStore
  });
  
  // Use React Query to fetch and cache document types
  const { 
    data: documentTypes = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['documentTypes', token], // Include token in query key to refetch when token changes
    queryFn: () => fetchDocumentTypes(token || undefined), // Pass token to fetch function
    enabled: !!token && shouldLoad // Only fetch if we have a token and shouldLoad is true
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
