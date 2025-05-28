import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';
import { DocumentType } from '../../types/odata-types';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';


const fetchDocumentTypes = async (token?: string | null): Promise<DocumentType[]> => {

  const requestOptions = {
    method: 'GET'
  } as any;
  

  if (token) {
    requestOptions.token = token;
  } else {
    console.warn('fetchDocumentTypes: No token provided, request may fail');
  }
  
  const response = await baseApiService.request(DOCUMENT_TYPES_ENDPOINT, requestOptions);
  const data = await response.json();
  return data.value || [];
};


export interface DocumentTypeDataProviderResult {
  documentTypes: DocumentType[];
  documentTypesStore: any;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}


export const useDocumentTypeDataProvider = (shouldLoad: boolean | undefined = true): DocumentTypeDataProviderResult => {

  const documentTypesStore = useODataStore(DOCUMENT_TYPES_ENDPOINT, 'guid', {

  });
  

  const { 
    data: documentTypes = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => fetchDocumentTypes(getToken()),
    enabled: shouldLoad
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
