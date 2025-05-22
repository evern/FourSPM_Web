import { useMemo, useState, useEffect } from 'react';
import { useTokenAcquisition } from '../use-token-acquisition';
import { setToken } from '../../utils/token-store';
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
  
  // Use the token acquisition hook
  const { token, acquireToken, loading: tokenLoading } = useTokenAcquisition();
  
  // Ensure token is available before enabling data providers
  useEffect(() => {
    const prepareToken = async () => {
      if (!token) {
        // Try to acquire a token
        console.log('useProjectData: Acquiring token for data providers');
        const newToken = await acquireToken();
        
        if (newToken) {
          // Store token in the global token store for ODataStore to use
          setToken(newToken);
          setTokenReady(true);
        } else {
          console.warn('useProjectData: Failed to acquire token for data providers');
          setTokenReady(false);
        }
      } else {
        // We already have a token, store it and enable queries
        setToken(token);
        setTokenReady(true);
      }
    };
    
    prepareToken();
  }, [token, acquireToken]);
  
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
    // If token isn't ready, try to acquire one first
    if (!tokenReady) {
      console.log('useProjectData: Acquiring token before refetching data');
      const newToken = await acquireToken();
      if (newToken) {
        setToken(newToken);
        setTokenReady(true);
      } else {
        console.warn('useProjectData: Failed to acquire token during refetchAll');
        return Promise.reject(new Error('Failed to acquire authentication token'));
      }
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
