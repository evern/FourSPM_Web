import { useMemo } from 'react';
import { getToken } from '../../utils/token-store';
import { useAreaDataProvider } from '../data-providers/useAreaDataProvider';
import { useDisciplineDataProvider } from '../data-providers/useDisciplineDataProvider';
import { useDocumentTypeDataProvider } from '../data-providers/useDocumentTypeDataProvider';


export const useProjectData = (projectId?: string) => {

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


  const isLoading = areasLoading || disciplinesLoading || documentTypesLoading;
  

  const error = areasError || disciplinesError || documentTypesError;


  const createCompatibleDataSource = <T extends { guid: string }>(data: T[]) => ({
    load: () => Promise.resolve(data),
    byKey: (key: string) => Promise.resolve(data.find(item => item.guid === key)),
  });


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

  const refetchAll = async () => {
    return Promise.all([
      refetchAreas(),
      refetchDisciplines(),
      refetchDocumentTypes()
    ]);
  };

  return {
    areas,
    disciplines,
    documentTypes,
    areasDataSource,
    disciplinesDataSource,
    documentTypesDataSource,
    isLoading,
    error,
    refetchAreas,
    refetchDisciplines,
    refetchDocumentTypes,
    refetchAll
  };
};
