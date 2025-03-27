import { sharedApiService } from '../api/shared-api.service';
import { DocumentType } from '../types/index';
import { DOCUMENT_TYPES_ENDPOINT } from '../config/api-endpoints';

/**
 * Gets all document types
 * @param token User authentication token
 * @returns Array of document types
 */
export const getDocumentTypes = async (token: string): Promise<DocumentType[]> => {
  try {
    return await sharedApiService.getAll<DocumentType>(DOCUMENT_TYPES_ENDPOINT, token);
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};
