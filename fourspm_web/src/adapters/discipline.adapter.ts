import { sharedApiService } from '../api/shared-api.service';
import { Discipline } from '../types/index';

/**
 * Gets all disciplines
 * @param token User authentication token
 * @returns Array of disciplines
 */
export const getDisciplines = async (token: string): Promise<Discipline[]> => {
  try {
    return await sharedApiService.getAll<Discipline>('/odata/v1/Disciplines', token);
  } catch (error) {
    console.error('Error fetching disciplines:', error);
    throw error;
  }
};

/**
 * Gets discipline details by GUID
 * @param disciplineId Discipline GUID
 * @param token User authentication token
 * @returns Discipline details
 */
export const getDisciplineDetails = async (disciplineId: string, token: string): Promise<Discipline> => {
  try {
    return await sharedApiService.getById<Discipline>('/odata/v1/Disciplines', disciplineId, token);
  } catch (error) {
    console.error('Error fetching discipline details:', error);
    throw error;
  }
};
