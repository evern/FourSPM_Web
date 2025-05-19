import { useState, useEffect, useCallback } from 'react';
import { getVariationById } from '../../adapters/variation.adapter';
import { Variation } from '../../types/odata-types';

/**
 * Hook to load variation data and provide access to its properties
 * 
 * @param variationGuid - GUID of the variation to load
 * @returns Object containing variation data, loading state, and project information
 */
export const useVariationInfo = (variationGuid: string) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  // Helper to determine if we have valid input parameters
  const hasValidParams = useCallback(() => {
    return Boolean(variationGuid);
  }, [variationGuid]);

  // Load variation data when inputs change
  const loadVariation = useCallback(async () => {
    if (!hasValidParams()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Token is now handled by MSAL internally
      const data = await getVariationById(variationGuid);
      setVariation(data);
    } catch (err) {
      setError(err);
      setVariation(null);
    } finally {
      setLoading(false);
    }
  }, [variationGuid, hasValidParams]);

  // Load variation on mount and when dependencies change
  useEffect(() => {
    loadVariation();
  }, [loadVariation]);

  // Extract projectGuid from variation for convenience
  const projectGuid = variation?.projectGuid || '';

  return {
    variation,
    loading,
    error,
    projectGuid,
    reload: loadVariation
  };
};
