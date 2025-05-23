import { useState, useEffect, useCallback } from 'react';
import { getVariationById } from '../../adapters/variation.adapter';
import { Variation } from '../../types/odata-types';
import { getToken } from '../../utils/token-store';

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

  // Using Optimized Direct Access Pattern - token retrieved at leaf methods only

  // Load variation data when inputs change
  const loadVariation = useCallback(async () => {
    if (!hasValidParams()) {
      return;
    }

    // Get token directly at the point of use (Optimized Direct Access Pattern)
    const token = getToken();
    if (!token) {
      setError(new Error('Authentication token is required for API requests'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use explicit token passing with token retrieved at the leaf method
      const data = await getVariationById(variationGuid, token);
      setVariation(data);
    } catch (err) {
      setError(err);
      setVariation(null);
    } finally {
      setLoading(false);
    }
  }, [variationGuid, hasValidParams]); // Direct token access - no token dependency needed

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
