import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DocumentType } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { DOCUMENT_TYPES_ENDPOINT } from '../../config/api-endpoints';
import { useAuth } from '../../contexts/auth';

// Module-level cache to ensure it's shared across ALL instances
// This is key to preventing multiple requests
let documentTypesGlobalCache: DocumentType[] | null = null;

// Flag to track if we're currently loading document type data
// This prevents duplicate API calls when multiple components initialize simultaneously
let isLoadingDocumentTypes = false;

/**
 * Interface for document type data provider result
 */
export interface DocumentTypeDataProviderResult {
  documentTypes: DocumentType[];
  documentTypesStore: ODataStore;
  documentTypesDataSource: any; // DataSource for lookup components
  isLoading: boolean;
  error: Error | null;
  getDocumentTypeById: (id: string) => DocumentType | undefined;
  getDocumentTypeByCode: (code: string) => DocumentType | undefined;
}

/**
 * Data provider hook for document type data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @param shouldLoad Optional boolean to control when data is loaded
 * @returns Object containing the document types store, data array, loading state, and helper methods
 */
export const useDocumentTypeDataProvider = (shouldLoad: boolean | undefined = true): DocumentTypeDataProviderResult => {
  const { user } = useAuth();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadCompleted = useRef(false);
  
  // Use the hook to get the store
  const documentTypesStore = useODataStore(DOCUMENT_TYPES_ENDPOINT);
  
  // Create a DataSource with caching for lookups
  const documentTypesDataSource = useMemo(() => {
    // Create the lookup data source with optimized load/byKey methods
    return {
      load: function(loadOptions: any) {
        // Skip loading if shouldLoad parameter is explicitly false or undefined
        if (shouldLoad === false || shouldLoad === undefined) {
          return Promise.resolve([]);
        }
        
        // If global cache already has data, use it immediately
        if (documentTypesGlobalCache) {
          // Document type data from global cache
          return Promise.resolve(documentTypesGlobalCache);
        }
        
        // If we already loaded data into component state, update global cache and return
        if (documentTypes.length > 0 && !isLoading) {
          // Document type data from component state
          documentTypesGlobalCache = documentTypes;
          return Promise.resolve(documentTypes);
        }
        
        // Check if another instance is already loading
        if (isLoadingDocumentTypes) {
          // Wait for the existing request to complete and use its results
          return new Promise<DocumentType[]>((resolve) => {
            const checkCacheInterval = setInterval(() => {
              if (!isLoadingDocumentTypes && documentTypesGlobalCache) {
                clearInterval(checkCacheInterval);
                resolve(documentTypesGlobalCache);
                
                // Update component state if needed
                if (!initialLoadCompleted.current) {
                  setDocumentTypes(documentTypesGlobalCache);
                  setIsLoading(false);
                  initialLoadCompleted.current = true;
                }
              }
            }, 100);
          });
        }
        
        // Set the loading flag to prevent duplicate requests
        isLoadingDocumentTypes = true;
        
        // Otherwise make a direct fetch to avoid ODataStore overhead
        // No cache available - fetching from server
        return fetch(DOCUMENT_TYPES_ENDPOINT, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const documentTypesData = data.value || data;
          
          // Update both global cache and component state
          documentTypesGlobalCache = documentTypesData;
          if (!initialLoadCompleted.current) {
            setDocumentTypes(documentTypesData);
            setIsLoading(false);
            initialLoadCompleted.current = true;
          }
          
          // Clear the loading flag
          isLoadingDocumentTypes = false;
          
          return documentTypesData;
        })
        .catch(err => {
          console.error('[DocumentTypeProvider] Error loading document type data:', err);
          setError(err as Error);
          setIsLoading(false);
          
          // Clear the loading flag on error too
          isLoadingDocumentTypes = false;
          
          return [];
        });
      },

      byKey: function(key: string) {
        // Always check global cache first (most efficient)
        if (documentTypesGlobalCache) {
          // Looking up document type by key from global cache
          const item = documentTypesGlobalCache.find(documentType => compareGuids(documentType.guid, key));
          return Promise.resolve(item);
        }
        
        // If we have document types in component state but not in global cache (shouldn't happen)
        if (documentTypes.length > 0) {
          // Looking up document type by key from component state
          const item = documentTypes.find(documentType => compareGuids(documentType.guid, key));
          
          // Update global cache for future lookups
          if (!documentTypesGlobalCache) {
            documentTypesGlobalCache = documentTypes;
          }
          
          return Promise.resolve(item);
        }
        
        // If no cache available, fetch just the one document type by key
        // Looking up document type by key from server
        const keyFilterUrl = `${DOCUMENT_TYPES_ENDPOINT}?$filter=guid eq '${key}'`;
        return fetch(keyFilterUrl, {
          headers: {
            'Authorization': user?.token ? `Bearer ${user.token}` : '',
            'Content-Type': 'application/json'
          }
        })
        .then(response => response.json())
        .then(data => {
          const items = data.value || data;
          return items.length > 0 ? items[0] : null;
        });
      }
    };
  }, [user?.token, documentTypes, isLoading]);
  
  // Initial data loading (if needed)
  useEffect(() => {
    // Skip loading if shouldLoad is explicitly set to false or undefined
    if (shouldLoad === false || shouldLoad === undefined) {
      // Early return - caller doesn't want to load data yet
      if (!initialLoadCompleted.current) {
        setIsLoading(false);
        initialLoadCompleted.current = true;
      }
      return;
    }
    
    // If we already have global cache data, use it and skip the request
    if (documentTypesGlobalCache && !initialLoadCompleted.current) {
      // Using global cache for initial load
      setDocumentTypes(documentTypesGlobalCache);
      setIsLoading(false);
      initialLoadCompleted.current = true;
      return;
    }
    
    // Only load once unless forced
    if (!initialLoadCompleted.current) {
      // Initial document type data load
      setIsLoading(true);
      
      // Use the data source load method to ensure cache is populated
      documentTypesDataSource.load({})
        .then((data: DocumentType[]) => {
          // Data and state updates are handled in the load method
        })
        .catch((err: Error) => {
          console.error('[DocumentTypeProvider] Error in initial load:', err);
          setError(err);
          setIsLoading(false);
        });
    }
  }, [documentTypesDataSource, shouldLoad]); // Re-run when shouldLoad changes
  
  /**
   * Get a document type by its ID
   * @param id The document type ID to look for
   * @returns The document type object or undefined if not found
   */
  const getDocumentTypeById = useCallback((id: string): DocumentType | undefined => {
    // Check global cache first for best performance
    if (documentTypesGlobalCache) {
      return documentTypesGlobalCache.find(docType => compareGuids(docType.guid, id));
    }
    return documentTypes.find(docType => compareGuids(docType.guid, id));
  }, [documentTypes]);
  
  /**
   * Get a document type by its code
   * @param code The document type code to look for
   * @returns The document type object or undefined if not found
   */
  const getDocumentTypeByCode = useCallback((code: string): DocumentType | undefined => {
    // Check global cache first for best performance
    if (documentTypesGlobalCache) {
      return documentTypesGlobalCache.find(docType => docType.code === code);
    }
    return documentTypes.find(docType => docType.code === code);
  }, [documentTypes]);
  
  return {
    documentTypes,
    documentTypesStore,
    documentTypesDataSource,
    isLoading,
    error,
    getDocumentTypeById,
    getDocumentTypeByCode
  };
};
