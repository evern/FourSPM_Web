import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';
import { DocumentType } from '../../types/odata-types';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';

/**
 * Fetch document types data from the API
 * @param token Optional token - can be string, null, or undefined
 * @returns Promise with array of document types
 */
const fetchDocumentTypes = async (token?: string | null): Promise<DocumentType[]> => {
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
  // Using Optimized Direct Access Pattern - token retrieved at leaf methods
  
  // Create a store for OData operations - token access is direct
  const documentTypesStore = useODataStore(DOCUMENT_TYPES_ENDPOINT, 'guid', {
    // No token needed here as the store will get it directly when needed
  });
  
  // Use React Query to fetch and cache document types - token access is optimized
  const { 
    data: documentTypes = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['documentTypes'], // No token dependency in query key - using Optimized Direct Access Pattern
    queryFn: () => fetchDocumentTypes(getToken()), // Get token directly at the point of use
    enabled: shouldLoad // Always enabled if shouldLoad is true - token check is done inside fetchDocumentTypes
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
