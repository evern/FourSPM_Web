import { useState, useEffect } from 'react';
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
  console.log('useAutoIncrement - Hook initialized with:', { endpoint, field, padLength, startFrom, filter });
  const [nextNumber, setNextNumber] = useState<string>(startFrom);
  const { user } = useAuth();

  const getNextNumber = async () => {
    try {
      console.log('getNextNumber - Starting with filter:', filter);
      
      // Base URL for OData query
      let url = `${endpoint}?$orderby=${field} desc&$top=1`;
      
      // Handle filter processing
      if (filter) {
        if (Array.isArray(filter)) {
          console.log('getNextNumber - Filter is array:', filter);
          if (Array.isArray(filter[0])) {
            console.log('getNextNumber - First element is array:', filter[0]);
            const condition = filter[0];
            
            if (Array.isArray(condition)) {
              const fieldName = condition[0];
              const operator = condition[1];
              const value = condition[2];
              
              console.log('getNextNumber - Extracted filter values:', { fieldName, operator, value });
              
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
              console.log('getNextNumber - Final URL with array filter:', url);
            }
          }
        } else {
          // Direct string filter
          url += `&$filter=${filter}`;
          console.log('getNextNumber - Final URL with string filter:', url);
        }
      }
      
      console.log('getNextNumber - Making request to URL:', url);
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          // Get more details about the error
          const errorText = await response.text();
          console.error('Raw response for error:', errorText);
          console.error(`Failed to fetch latest ${field}:`, response.status, response.statusText);
          throw new Error(`Failed to fetch latest ${field}`);
        }

        // Print out raw response for debugging
        const rawText = await response.clone().text();
        console.log('Raw response text:', rawText);
        
        const data = await response.json();
        console.log('Full response data:', data);
        
        const items = data.value || [];
        console.log('getNextNumber - Response data items:', items);
        
        if (items.length === 0) {
          console.log('getNextNumber - No items found, using startFrom:', startFrom);
          return startFrom;
        }

        const lastNumber = items[0][field];
        console.log('getNextNumber - Last number found:', lastNumber);
        
        const numericPart = lastNumber.replace(/\D/g, '');
        console.log('getNextNumber - Numeric part:', numericPart);
        
        if (!numericPart) {
          console.log('getNextNumber - No numeric part, using startFrom:', startFrom);
          return startFrom;
        }
        
        const nextNum = parseInt(numericPart, 10) + 1;
        const result = nextNum.toString().padStart(padLength, '0');
        console.log('getNextNumber - Calculated next number:', result);
        
        return result;
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        // Fall back to default value on error
        return startFrom;
      }
    } catch (error) {
      console.error(`Error getting next ${field}:`, error);
      return startFrom;
    }
  };

  useEffect(() => {
    console.log('useAutoIncrement - useEffect triggered, user token:', !!user?.token);
    if (user?.token) {
      getNextNumber().then(number => {
        console.log('useAutoIncrement - Setting next number to:', number);
        setNextNumber(number);
      });
    }
  }, [user?.token]);

  const refreshNextNumber = () => {
    console.log('useAutoIncrement - refreshNextNumber called');
    if (user?.token) {
      getNextNumber().then(number => {
        console.log('useAutoIncrement - Refreshed next number to:', number);
        setNextNumber(number);
      });
    }
  };

  return { nextNumber, refreshNextNumber };
};
