import { useState, useEffect, useCallback } from 'react';
import { getVariationById } from '../../adapters/variation.adapter';
import { Variation } from '../../types/odata-types';

/**
 * Hook to load variation data and provide access to its properties
 * 
 * @param variationGuid - GUID of the variation to load
 * @param userToken - Authentication token
 * @returns Object containing variation data, loading state, and project information
 */
export const useVariationInfo = (variationGuid: string, userToken?: string) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  // Helper to determine if we have valid input parameters
  const hasValidParams = useCallback(() => {
    return Boolean(variationGuid && userToken);
  }, [variationGuid, userToken]);

  // Load variation data when inputs change
  const loadVariation = useCallback(async () => {
    if (!hasValidParams()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getVariationById(variationGuid, userToken || '');
      setVariation(data);
    } catch (err) {
      setError(err);
      setVariation(null);
    } finally {
      setLoading(false);
    }
  }, [variationGuid, userToken, hasValidParams]);

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
