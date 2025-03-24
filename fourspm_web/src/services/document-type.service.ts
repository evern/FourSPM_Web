import { sharedApiService } from './api/shared-api.service';

/**
 * Interface for DocumentType entity
 */
export interface DocumentType {
  guid: string;
  code: string;
  description: string;
}

/**
 * Gets all document types
 * @param token User authentication token
 * @returns Array of document types
 */
export const getDocumentTypes = async (token: string): Promise<DocumentType[]> => {
  try {
    return await sharedApiService.getAll<DocumentType>('/odata/v1/DocumentTypes', token);
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

/**
 * Gets document type details by GUID
 * @param documentTypeId Document type GUID
 * @param token User authentication token
 * @returns Document type details
 */
export const getDocumentTypeDetails = async (documentTypeId: string, token: string): Promise<DocumentType> => {
  try {
    return await sharedApiService.getById<DocumentType>('/odata/v1/DocumentTypes', documentTypeId, token);
  } catch (error) {
    console.error('Error fetching document type details:', error);
    throw error;
  }
};
