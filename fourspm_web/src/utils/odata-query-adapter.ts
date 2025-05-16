/**
 * OData query adapter for handling OData requests with DevExtreme compatibility
 * Following the FourSPM UI Development Guidelines and API standardization patterns
 */
import { apiRequest } from '../api/base-api.service';
import { ODataResponse } from '../types/app-types';

/**
 * Options for loading OData data
 */
export interface ODataLoadOptions {
  skip?: number;
  take?: number;
  sort?: Array<{ selector: string; desc?: boolean }>;
  filter?: any;
  expand?: string;
  select?: string;
  requireTotalCount?: boolean;
  searchExpr?: string | string[];
  searchOperation?: string;
  searchValue?: any;
  group?: any;
  requireGroupCount?: boolean;
  totalSummary?: any;
  groupSummary?: any;
  customQueryParams?: Record<string, string>;
}

/**
 * Result of an OData load operation
 */
export interface ODataLoadResult<T = any> {
  data: T[];
  totalCount?: number;
  groupCount?: number;
  summary?: any;
}

/**
 * Creates an OData query adapter for the specified URL
 * @param url The OData endpoint URL
 * @returns An adapter with load method compatible with DevExtreme data sources
 */
export const createODataQueryAdapter = (url: string) => {
  /**
   * Loads data from the OData endpoint
   * @param options OData load options compatible with DevExtreme
   * @returns Promise resolving to the loaded data and metadata
   */
  const load = async (options: ODataLoadOptions = {}): Promise<ODataLoadResult> => {
    // Build OData query parameters
    const queryParams: string[] = [];
    
    // Handle filtering
    if (options.filter) {
      // If the filter is already a string, use it directly
      if (typeof options.filter === 'string') {
        queryParams.push(`$filter=${encodeURIComponent(options.filter)}`);
      } 
      // Otherwise, it's a complex filter object - in a real implementation
      // this would convert from DevExtreme filter syntax to OData filter syntax
    }
    
    // Handle pagination
    if (options.skip) {
      queryParams.push(`$skip=${options.skip}`);
    }
    
    if (options.take) {
      queryParams.push(`$top=${options.take}`);
    }
    
    // Handle sorting
    if (options.sort && options.sort.length) {
      const orderBy = options.sort
        .map(sort => `${sort.selector} ${sort.desc ? 'desc' : 'asc'}`)
        .join(',');
      queryParams.push(`$orderby=${encodeURIComponent(orderBy)}`);
    }
    
    // Handle expand
    if (options.expand) {
      queryParams.push(`$expand=${encodeURIComponent(options.expand)}`);
    }
    
    // Handle select
    if (options.select) {
      queryParams.push(`$select=${encodeURIComponent(options.select)}`);
    }
    
    // Handle count
    if (options.requireTotalCount) {
      queryParams.push('$count=true');
    }
    
    // Add custom query parameters
    if (options.customQueryParams) {
      Object.entries(options.customQueryParams).forEach(([key, value]) => {
        queryParams.push(`${key}=${encodeURIComponent(value)}`);
      });
    }
    
    // Build the final URL
    const finalUrl = queryParams.length 
      ? `${url}?${queryParams.join('&')}` 
      : url;
    
    // Make the request
    const response = await apiRequest(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`OData request failed: ${response.status} ${response.statusText}`);
    }
    
    const responseData: ODataResponse<any> = await response.json();
    
    return {
      data: responseData.value,
      totalCount: responseData['@odata.count'],
    };
  };
  
  return { load };
};
