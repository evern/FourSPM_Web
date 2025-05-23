import { useMemo } from 'react';
import { getToken } from '../../utils/token-store';
import { useAreaDataProvider } from '../data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../data-providers/useDocumentTypeDataProvider';

/**
 * Consolidated data hook for project-related reference data
 * Combines multiple data providers into a single hook
 * @param projectId The project ID to fetch data for
 */
export const useProjectData = (projectId?: string) => {
  // Using Optimized Direct Access Pattern - token retrieved at leaf methods
  // No token state management needed here as data providers will get tokens directly


  // Use the individual data providers - passing projectId directly
  const { 
    areas, 
    isLoading: areasLoading, 
    error: areasError,
    refetch: refetchAreas 
  } = useAreaDataProvider(projectId);

  const { 
    disciplines, 
    isLoading: disciplinesLoading, 
    error: disciplinesError,
    refetch: refetchDisciplines 
  } = useDisciplineDataProvider();

  const { 
    documentTypes, 
    isLoading: documentTypesLoading, 
    error: documentTypesError,
    refetch: refetchDocumentTypes 
  } = useDocumentTypeDataProvider();

  // Combine loading and error states from data providers
  const isLoading = areasLoading || disciplinesLoading || documentTypesLoading;
  
  // Return the first error encountered, if any
  const error = areasError || disciplinesError || documentTypesError;

  // Create compatible data sources for DevExtreme components
  const createCompatibleDataSource = <T extends { guid: string }>(data: T[]) => ({
    load: () => Promise.resolve(data),
    byKey: (key: string) => Promise.resolve(data.find(item => item.guid === key)),
  });

  // Memoize the compatible data sources to prevent unnecessary re-renders
  const areasDataSource = useMemo(
    () => areas ? createCompatibleDataSource(areas) : null, 
    [areas]
  );

  const disciplinesDataSource = useMemo(
    () => disciplines ? createCompatibleDataSource(disciplines) : null, 
    [disciplines]
  );

  const documentTypesDataSource = useMemo(
    () => documentTypes ? createCompatibleDataSource(documentTypes) : null, 
    [documentTypes]
  );

  // Function to refetch all data
  const refetchAll = async () => {
    // Using Optimized Direct Access Pattern - token check is done in each data provider
    // No need to check token here as each refetch function will handle that internally
    
    // Refetch all data sources in parallel
    return Promise.all([
      refetchAreas(),
      refetchDisciplines(),
      refetchDocumentTypes()
    ]);
  };

  return {
    // Raw data arrays
    areas,
    disciplines,
    documentTypes,
    
    // Compatible data sources for DevExtreme components
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    
    // Status indicators
    isLoading,
    error,
    
    // Refetch functions
    refetchAreas,
    refetchDisciplines,
    refetchDocumentTypes,
    refetchAll
  };
};
