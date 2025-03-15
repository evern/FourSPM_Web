import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';

interface UseAutoIncrementProps {
  endpoint: string;
  field: string;
  padLength?: number;
  startFrom?: string;
}

export const useAutoIncrement = ({
  endpoint,
  field,
  padLength = 2,
  startFrom = '01'
}: UseAutoIncrementProps) => {
  const [nextNumber, setNextNumber] = useState<string>(startFrom);
  const { user } = useAuth();

  const getNextNumber = async () => {
    try {
      const response = await fetch(`${endpoint}?$orderby=${field} desc&$top=1`, {
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
      
      // Extract numeric portion of lastNumber if it contains non-numeric characters
      const numericPart = lastNumber.replace(/\D/g, '');
      
      if (!numericPart) {
        // If there are no numeric characters in the lastNumber, use startFrom
        return startFrom;
      }
      
      // Parse the numeric portion and increment
      const nextNum = parseInt(numericPart, 10) + 1;
      
      // Ensure the number is formatted with the correct padding
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
