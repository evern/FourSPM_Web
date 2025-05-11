import { useState, useEffect, useRef } from 'react';

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
    // Use a ref to store the latest params
    const paramsRef = useRef<P>(params);
    
    // Update the ref whenever params change
    useEffect(() => {
      paramsRef.current = params;
    }, [params]);

    // Trigger fetch whenever params change
    useEffect(() => {
      // Skip fetching if dependencies aren't ready
      if (dependencyFn && !dependencyFn(...paramsRef.current)) {
        return;
      }
      
      const loadData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const result = await fetchFn(...paramsRef.current);
          setData(result);
        } catch (err) {
          console.error(`Error fetching data:`, err);
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(params)]); // Use JSON.stringify as a stable dependency

    return {
      data,
      isLoading,
      error
    };
  };
}
