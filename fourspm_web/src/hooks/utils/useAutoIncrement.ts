import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/auth';

interface UseAutoIncrementProps {
  endpoint: string;
  field: string;
  padLength?: number;
  startFrom?: string;
  filter?: string | Array<any>;
}

export const useAutoIncrement = ({
  endpoint,
  field,
  padLength = 2,
  startFrom = '01',
  filter
}: UseAutoIncrementProps) => {
  const [nextNumber, setNextNumber] = useState<string>(startFrom);
  const { user } = useAuth();
  
  // Use refs to track hook initialization and request count
  const initCountRef = useRef(0);
  const requestCountRef = useRef(0);
  
  // Initialize hook
  useEffect(() => {
    initCountRef.current += 1;
    
    return () => {
      // Cleanup
    };
  }, [endpoint, field]);

  const getNextNumber = useCallback(async () => {
    // Track API request count
    requestCountRef.current += 1;
    
    try {
      // Base URL for OData query
      let url = `${endpoint}?$orderby=${field} desc&$top=1`;
      
      // Handle filter processing
      if (filter) {
        if (Array.isArray(filter)) {

          if (Array.isArray(filter[0])) {

            const condition = filter[0];
            
            if (Array.isArray(condition)) {
              const fieldName = condition[0];
              const operator = condition[1];
              const value = condition[2];
              

              
              const operatorMap: { [key: string]: string } = {
                '=': 'eq',
                '>': 'gt',
                '<': 'lt',
                '>=': 'ge',
                '<=': 'le',
                '<>': 'ne'
              };
              
              const odataOperator = operatorMap[operator] || operator;
              
              // Properly handle GUIDs for OData v4
              let formattedValue;
              if (typeof value === 'string' && fieldName.toLowerCase().includes('guid')) {
                // Format GUID for OData v4
                formattedValue = value.includes('-') ? `guid'${value}'` : value;
              } else if (typeof value === 'string') {
                formattedValue = `'${value}'`;
              } else {
                formattedValue = value;
              }
              
              url += `&$filter=${fieldName} ${odataOperator} ${formattedValue}`;

            }
          }
        } else {
          // Direct string filter
          url += `&$filter=${filter}`;

        }
      }
      

      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch latest ${field}`);
        }

        
        const data = await response.json();

        
        const items = data.value || [];

        
        if (items.length === 0) {

          return startFrom;
        }

        const lastNumber = items[0][field];

        
        const numericPart = lastNumber.replace(/\D/g, '');

        
        if (!numericPart) {

          return startFrom;
        }
        
        const nextNum = parseInt(numericPart, 10) + 1;
        const result = nextNum.toString().padStart(padLength, '0');

        
        return result;
      } catch (fetchError) {

        // Fall back to default value on error
        return startFrom;
      }
    } catch (error) {

      return startFrom;
    }
  }, [endpoint, field, filter, padLength, startFrom, user?.token]);

  useEffect(() => {
    // Only fetch if we have a token
    if (user?.token) {
      getNextNumber().then(number => {
        setNextNumber(number);
      });
    }
  }, [user?.token, getNextNumber]);

  const refreshNextNumber = () => {
    if (user?.token) {
      getNextNumber().then(number => {
        setNextNumber(number);
      });
    }
  };

  return { nextNumber, refreshNextNumber };
};
