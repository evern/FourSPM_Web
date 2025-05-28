import { useQuery } from '@tanstack/react-query';
import { useODataStore } from '../../stores/odataStores';
import { AREAS_ENDPOINT } from '../../config/api-endpoints';
import { Area } from '../../types/odata-types';
import ODataStore from 'devextreme/data/odata/store';
import { baseApiService } from '../../api/base-api.service';
import { getToken } from '../../utils/token-store';


type AreaWithAliases = Area & {
  areaNumber?: string;
};


const fetchAreas = async (token?: string | null, projectId?: string): Promise<Area[]> => {

  const requestOptions = {
    method: 'GET'
  } as any;
  

  if (token) {
    requestOptions.token = token;
  } else {
    console.warn('fetchAreas: No token provided, request may fail');
  }
  
  const filter = projectId ? `$filter=projectGuid eq ${projectId}` : '';
  const url = `${AREAS_ENDPOINT}?${filter}`;
  
  const response = await baseApiService.request(url, requestOptions);
  const data = await response.json();
  
  return data.value || [];
};


export interface AreaDataProviderResult {
  areas: AreaWithAliases[];
  areasStore: ODataStore;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
}


export const useAreaDataProvider = (projectId?: string): AreaDataProviderResult => {

  const areasStore = useODataStore(AREAS_ENDPOINT, 'guid', {
    fieldTypes: {
      number: 'string',
      projectGuid: 'Guid'
    }
  });
  

  const { 
    data: areasData = [], 
    isLoading, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['areas', projectId],
    queryFn: () => fetchAreas(getToken(), projectId),
    enabled: !!projectId,
    select: (data: Area[]) => data,
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000
  });
  

  const areas = areasData as AreaWithAliases[];
  const error = queryError as Error | null;





  return {
    areas,
    areasStore,
    isLoading,
    error,
    refetch
  };
};
