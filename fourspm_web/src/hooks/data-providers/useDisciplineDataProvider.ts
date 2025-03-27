import { useState, useEffect, useCallback, useMemo } from 'react';
import { Discipline } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { DISCIPLINES_ENDPOINT } from '../../config/api-endpoints';

/**
 * Interface for discipline data provider result
 */
export interface DisciplineDataProviderResult {
  disciplines: Discipline[];
  disciplinesStore: ODataStore;
  disciplinesDataSource: any; // DataSource for lookup components
  isLoading: boolean;
  error: Error | null;
  getDisciplineById: (id: string) => Discipline | undefined;
  getDisciplineByCode: (code: string) => Discipline | undefined;
}

/**
 * Data provider hook for discipline data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the disciplines store, data array, loading state, and helper methods
 */
export const useDisciplineDataProvider = (): DisciplineDataProviderResult => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use the hook to get the store
  const disciplinesStore = useODataStore(DISCIPLINES_ENDPOINT);
  
  // Create a DataSource for lookups
  const disciplinesDataSource = useMemo(() => {
    return {
      store: disciplinesStore
    };
  }, [disciplinesStore]);
  
  // Load data from store on component mount
  useEffect(() => {
    setIsLoading(true);
    disciplinesStore.load()
      .then((data: Discipline[]) => {
        setDisciplines(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        console.error('Error loading disciplines:', err);
        setError(err);
        setIsLoading(false);
      });
  }, [disciplinesStore]);
  
  /**
   * Get a discipline by its ID
   * @param id The discipline ID to look for
   * @returns The discipline object or undefined if not found
   */
  const getDisciplineById = useCallback((id: string): Discipline | undefined => {
    return disciplines.find(discipline => compareGuids(discipline.guid, id));
  }, [disciplines]);
  
  /**
   * Get a discipline by its code
   * @param code The discipline code to look for
   * @returns The discipline object or undefined if not found
   */
  const getDisciplineByCode = useCallback((code: string): Discipline | undefined => {
    return disciplines.find(discipline => discipline.code === code);
  }, [disciplines]);
  
  return {
    disciplines,
    disciplinesStore,
    disciplinesDataSource,
    isLoading,
    error,
    getDisciplineById,
    getDisciplineByCode
  };
};
