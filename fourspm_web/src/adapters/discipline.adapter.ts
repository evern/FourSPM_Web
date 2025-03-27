import { sharedApiService } from '../api/shared-api.service';
import { Discipline } from '../types/index';
import { DISCIPLINES_ENDPOINT } from '../config/api-endpoints';

/**
 * Gets all disciplines
 * @param token User authentication token
 * @returns Array of disciplines
 */
export const getDisciplines = async (token: string): Promise<Discipline[]> => {
  try {
    return await sharedApiService.getAll<Discipline>(DISCIPLINES_ENDPOINT, token);
  } catch (error) {
    console.error('Error fetching disciplines:', error);
    throw error;
  }
};
