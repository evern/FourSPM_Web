import { useState, useCallback } from 'react';
import { getDocumentTypes, getDocumentTypeDetails, DocumentType } from '../services/document-type.service';
import notify from 'devextreme/ui/notify';

/**
 * Hook to manage document type data operations
 * @param userToken The user's authentication token
 * @returns Object containing document type data state and handler functions
 */
export const useDocumentTypeData = (userToken: string | undefined) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Load all document types
   * @returns Array of document types if successful
   */
  const loadDocumentTypes = useCallback(async (): Promise<DocumentType[] | null> => {
    if (!userToken) return null;
    
    setIsLoading(true);
    try {
      const types = await getDocumentTypes(userToken);
      setDocumentTypes(types);
      return types;
    } catch (error) {
      console.error('Error fetching document types:', error);
      notify('Error loading document types', 'error', 3000);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  /**
   * Load document type data for a specific ID
   * @param documentTypeId Document type GUID
   * @returns Document type details if successful
   */
  const loadDocumentTypeData = useCallback(async (documentTypeId: string): Promise<DocumentType | null> => {
    if (!userToken || !documentTypeId) return null;
    
    setIsLoading(true);
    try {
      const documentType = await getDocumentTypeDetails(documentTypeId, userToken);
      setSelectedDocumentType(documentType);
      return documentType;
    } catch (error) {
      console.error('Error fetching document type details:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  return {
    documentTypes,
    selectedDocumentType,
    isLoading,
    loadDocumentTypes,
    loadDocumentTypeData
  };
};
