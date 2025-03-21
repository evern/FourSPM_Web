import { useState, useEffect } from 'react';
import { DeliverableGate } from '../types/progress';
import { fetchDeliverableGates } from '../services/deliverable-gate.service';

/**
 * Hook to fetch and provide deliverable gates data
 * @param userToken The user's authentication token
 * @returns Object containing deliverable gates array, loading state, and error state
 */
export const useDeliverableGates = (userToken: string | undefined) => {
  const [deliverableGates, setDeliverableGates] = useState<DeliverableGate[]>([]);
  const [isLoadingGates, setIsLoadingGates] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeliverableGates = async () => {
      if (!userToken) {
        setIsLoadingGates(false);
        return;
      }
      
      setIsLoadingGates(true);
      setError(null);
      
      try {
        const gates = await fetchDeliverableGates(userToken);
        setDeliverableGates(gates);
      } catch (error: any) {
        console.error('Error loading deliverable gates:', error);
        setError(`Error loading deliverable gates: ${error.message}`);
      } finally {
        setIsLoadingGates(false);
      }
    };
    
    loadDeliverableGates();
  }, [userToken]);

  return { deliverableGates, isLoadingGates, error };
};
