import { useState, useEffect, useCallback, useMemo } from 'react';
import { DeliverableGate } from '../../types/odata-types';
import { useODataStore } from '../../stores/odataStores';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { compareGuids } from '../../utils/guid-utils';
import { DELIVERABLE_GATES_ENDPOINT } from '../../config/api-endpoints';

/**
 * Interface for deliverable gate data provider result
 */
export interface DeliverableGateDataProviderResult {
  gates: DeliverableGate[];
  gatesStore: ODataStore;
  gatesDataSource: any; // DataSource for lookup components
  isLoading: boolean;
  error: Error | null;
  getGateById: (id: string) => DeliverableGate | undefined;
  getGateBySequence: (sequence: number) => DeliverableGate | undefined;
}

/**
 * Data provider hook for deliverable gate data
 * Manages both ODataStore for grid binding and in-memory data for validation
 * 
 * @returns Object containing the deliverable gates store, data array, loading state, and helper methods
 */
export const useDeliverableGateDataProvider = (): DeliverableGateDataProviderResult => {
  const [gates, setGates] = useState<DeliverableGate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use the hook to get the store
  const gatesStore = useODataStore(DELIVERABLE_GATES_ENDPOINT);
  
  // Create a DataSource with sorting for lookups
  const gatesDataSource = useMemo(() => {
    return {
      store: gatesStore,
      sort: [{ selector: 'autoPercentage', desc: false }]
    };
  }, [gatesStore]);
  
  // Load data from store on component mount
  useEffect(() => {
    setIsLoading(true);
    gatesStore.load({
      sort: [{ selector: 'autoPercentage', desc: false }]
    })
      .then((data: DeliverableGate[]) => {
        setGates(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        console.error('Error loading deliverable gates:', err);
        setError(err);
        setIsLoading(false);
      });
  }, [gatesStore]);
  
  /**
   * Get a deliverable gate by its ID
   * @param id The gate ID to look for
   * @returns The gate object or undefined if not found
   */
  const getGateById = useCallback((id: string): DeliverableGate | undefined => {
    return gates.find(gate => compareGuids(gate.guid, id));
  }, [gates]);
  
  /**
   * Get a deliverable gate by its sequence number (using autoPercentage)
   * @param sequence The sequence number to look for
   * @returns The gate object or undefined if not found
   */
  const getGateBySequence = useCallback((sequence: number): DeliverableGate | undefined => {
    // Since sequence property doesn't exist, we're using autoPercentage as the equivalent
    return gates.find(gate => gate.autoPercentage === sequence);
  }, [gates]);
  
  return {
    gates,
    gatesStore,
    gatesDataSource,
    isLoading,
    error,
    getGateById,
    getGateBySequence
  };
};
