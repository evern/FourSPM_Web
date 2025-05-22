import { useMemo, useState, useEffect } from 'react';
import { useToken } from '../../contexts/token-context';
import { useAreaDataProvider } from '../data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../data-providers/useDocumentTypeDataProvider';

/**
 * Consolidated data hook for project-related reference data
 * Combines multiple data providers into a single hook
 * @param projectId The project ID to fetch data for
 */
export const useProjectData = (projectId?: string) => {
  const [tokenReady, setTokenReady] = useState(false);
  
  // Use the token context
  const { token, loading: tokenLoading } = useToken();
  
  // Check if token is available and update readiness
  useEffect(() => {
    if (token) {
      // We have a token, enable queries
      console.log('useProjectData: Token available from context');
      setTokenReady(true);
    } else {
      // No token available yet
      console.log('useProjectData: No token available from context');
      setTokenReady(false);
    }
  }, [token]);
  
  // We need to pass projectId only if token is ready and we're authorized
  const effectiveProjectId = tokenReady ? projectId : undefined;

  // Use the individual data providers
  const { 
    areas, 
    isLoading: areasLoading, 
    error: areasError,
    refetch: refetchAreas 
  } = useAreaDataProvider(effectiveProjectId);

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

  // Combine loading and error states
  const isLoading = tokenLoading || areasLoading || disciplinesLoading || documentTypesLoading;
  
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
    // Check if we have a valid token before attempting to refetch
    if (!token) {
      console.warn('useProjectData: No token available during refetchAll');
      return Promise.reject(new Error('No authentication token available'));
    }
    
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
