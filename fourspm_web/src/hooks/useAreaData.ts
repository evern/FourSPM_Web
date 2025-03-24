import { useState, useCallback } from 'react';
import { getAreas, getAreaDetails, getProjectAreas, Area } from '../services/area.service';
import notify from 'devextreme/ui/notify';

/**
 * Hook to manage area data operations
 * @param userToken The user's authentication token
 * @returns Object containing area data state and handler functions
 */
export const useAreaData = (userToken: string | undefined) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Load all areas
   * @returns Array of areas if successful
   */
  const loadAreas = useCallback(async (): Promise<Area[] | null> => {
    if (!userToken) return null;
    
    setIsLoading(true);
    try {
      const areasData = await getAreas(userToken);
      setAreas(areasData);
      return areasData;
    } catch (error) {
      console.error('Error fetching areas:', error);
      notify('Error loading areas', 'error', 3000);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  /**
   * Load all areas for a specific project
   * @param projectId Project GUID
   * @returns Array of areas if successful
   */
  const loadProjectAreas = useCallback(async (projectId: string): Promise<Area[] | null> => {
    if (!userToken || !projectId) return null;
    
    setIsLoading(true);
    try {
      const areasData = await getProjectAreas(projectId, userToken);
      setAreas(areasData);
      return areasData;
    } catch (error) {
      console.error(`Error fetching areas for project ${projectId}:`, error);
      notify('Error loading project areas', 'error', 3000);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  /**
   * Load area data for a specific ID
   * @param areaId Area GUID
   * @returns Area details if successful
   */
  const loadAreaData = useCallback(async (areaId: string): Promise<Area | null> => {
    if (!userToken || !areaId) return null;
    
    setIsLoading(true);
    try {
      const area = await getAreaDetails(areaId, userToken);
      setSelectedArea(area);
      return area;
    } catch (error) {
      console.error('Error fetching area details:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userToken]);

  return {
    areas,
    selectedArea,
    isLoading,
    loadAreas,
    loadProjectAreas,
    loadAreaData
  };
};
