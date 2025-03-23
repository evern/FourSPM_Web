import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';

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

  const getNextNumber = async () => {
    try {
      let url = `${endpoint}?$orderby=${field} desc&$top=1`;
      
      if (filter) {
        if (Array.isArray(filter)) {
          if (Array.isArray(filter[0])) {
            const [field, operator, value] = filter[0];
            const operatorMap: { [key: string]: string } = {
              '=': 'eq',
              '>': 'gt',
              '<': 'lt',
              '>=': 'ge',
              '<=': 'le',
              '<>': 'ne'
            };
            
            const odataOperator = operatorMap[operator] || operator;
            const formattedValue = typeof value === 'string' ? 
              `'${value}'` : value;
            
            url += `&$filter=(${field} ${odataOperator} ${formattedValue})`;
          }
        } else {
          url += `&$filter=${filter}`;
        }
      }
      
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
      
      return nextNum.toString().padStart(padLength, '0');
    } catch (error) {
      console.error(`Error getting next ${field}:`, error);
      return startFrom;
    }
  };

  useEffect(() => {
    if (user?.token) {
      getNextNumber().then(number => setNextNumber(number));
    }
  }, [user?.token]);

  const refreshNextNumber = () => {
    if (user?.token) {
      getNextNumber().then(number => setNextNumber(number));
    }
  };

  return { nextNumber, refreshNextNumber };
};
