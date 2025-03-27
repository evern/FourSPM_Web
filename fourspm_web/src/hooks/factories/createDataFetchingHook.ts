import { useState, useEffect } from 'react';

/**
 * Interface for the data fetching hook result
 * @template T The type of data being fetched
 */
export interface DataFetchingResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Factory function to create a standardized data fetching hook
 * @template T The type of data to fetch
 * @template P The type of parameters needed to fetch the data
 * @param fetchFn The function that fetches the data
 * @param dependencyFn Optional function to determine if data should be fetched
 * @returns A hook function that manages fetching, loading state, and errors
 */
export function createDataFetchingHook<T, P extends any[]>(
  fetchFn: (...params: P) => Promise<T>,
  dependencyFn?: (...params: P) => boolean
) {
  return (...params: P): DataFetchingResult<T> => {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      // Skip fetching if dependencies aren't ready
      if (dependencyFn && !dependencyFn(...params)) {
        return;
      }
      
      const loadData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const result = await fetchFn(...params);
          setData(result);
        } catch (err) {
          console.error(`Error fetching data:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    }, params);

    return {
      data,
      isLoading,
      error
    };
  };
}
