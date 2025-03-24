import { useState, useCallback } from 'react';
import { getDisciplines, getDisciplineDetails, Discipline } from '../services/discipline.service';
import notify from 'devextreme/ui/notify';

/**
 * Hook to manage discipline data operations
 * @param userToken The user's authentication token
 * @returns Object containing discipline data state and handler functions
 */
export const useDisciplineData = (userToken: string | undefined) => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Load all disciplines
   * @returns Array of disciplines if successful
   */
  const loadDisciplines = useCallback(async (): Promise<Discipline[] | null> => {
    if (!userToken) return null;
    
    setIsLoading(true);
    try {
      const disciplinesData = await getDisciplines(userToken);
      setDisciplines(disciplinesData);
      return disciplinesData;
    } catch (error) {
      console.error('Error fetching disciplines:', error);
      notify('Error loading disciplines', 'error', 3000);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  /**
   * Load discipline data for a specific ID
   * @param disciplineId Discipline GUID
   * @returns Discipline details if successful
   */
  const loadDisciplineData = useCallback(async (disciplineId: string): Promise<Discipline | null> => {
    if (!userToken || !disciplineId) return null;
    
    setIsLoading(true);
    try {
      const discipline = await getDisciplineDetails(disciplineId, userToken);
      setSelectedDiscipline(discipline);
      return discipline;
    } catch (error) {
      console.error('Error fetching discipline details:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  return {
    disciplines,
    selectedDiscipline,
    isLoading,
    loadDisciplines,
    loadDisciplineData
  };
};
