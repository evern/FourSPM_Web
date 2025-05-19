import { useState, useEffect, useRef, useCallback } from 'react';
import { useMSALAuth } from '../../contexts/msal-auth';

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
  const { acquireToken } = useMSALAuth();
  
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
      // Create a URL object to properly handle parameter encoding
      // First create the base URL without query parameters
      let url = new URL(endpoint);
      
      // Use proper encoding for OData parameters
      // OData requires spaces to be encoded as %20 rather than +
      url.searchParams.set('$orderby', `${field} desc`);
      url.searchParams.set('$top', '1');
      
      // Create a clean URL string with proper encoding
      let urlString = url.toString();
      // Fix any '+' encodings to be proper '%20' for OData
      urlString = urlString.replace(/\+/g, '%20');
      
      // Handle filter processing
      if (filter) {
        // Create a new URL object to update the parameters
        let updatedUrl = new URL(urlString);
        
        if (Array.isArray(filter)) {
          if (Array.isArray(filter[0])) {
            const condition = filter[0];
            
            if (Array.isArray(condition)) {
              const fieldName = condition[0];
              const operator = condition[1];
              const value = condition[2];
              
              // Map common comparison operators to OData operators
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
              
              // Add filter to URL parameters
              updatedUrl.searchParams.set('$filter', `${fieldName} ${odataOperator} ${formattedValue}`);
            }
          }
        } else {
          // Direct string filter
          updatedUrl.searchParams.set('$filter', filter);
        }
        
        // Update the URL string with filter parameters
        urlString = updatedUrl.toString().replace(/\+/g, '%20');
      }
      

      
      try {
        // Acquire a token using MSAL
        const token = await acquireToken();
        
        if (!token) {
          console.error('useAutoIncrement: No token available');
          return startFrom;
        }
        
        // Initialize headers object
        const headers: Record<string, string> = {};
        
        // Add authorization headers without overwriting the entire headers object
        headers['Authorization'] = `Bearer ${token}`;
        headers['Accept'] = 'application/json';
        
        // Make the request with properly formatted headers and the correctly encoded URL
        console.log('Fetching from URL:', urlString);
        const response = await fetch(urlString, { headers });
        
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
  }, [endpoint, field, filter, padLength, startFrom, acquireToken]);

  useEffect(() => {
    // Always try to fetch on mount - acquireToken will handle authentication
    getNextNumber().then(number => {
      setNextNumber(number);
    }).catch(error => {
      console.error('Failed to get next number:', error);
    });
  }, [getNextNumber]);

  const refreshNextNumber = () => {
    getNextNumber().then(number => {
      setNextNumber(number);
    }).catch(error => {
      console.error('Failed to refresh next number:', error);
    });
  };

  return { nextNumber, refreshNextNumber };
};
