import { useState, useEffect } from 'react';

/**
 * Hook for managing period state and calculations
 * 
 * Follows the same standardized approach as other utility hooks
 * Centralizes period state management and date calculations
 * 
 * @param initialPeriod The initial period value (usually from useProjectInfo)
 * @param projectStartDate The project's progress start date
 * @returns Object containing period state and helper functions
 */
export const usePeriodManager = (initialPeriod: number | null, projectStartDate?: string | null) => {
  // Internal state
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [progressDate, setProgressDate] = useState<Date>(new Date());
  
  // Initialize selectedPeriod once initialPeriod is available
  useEffect(() => {
    if (initialPeriod !== null && selectedPeriod === null) {
      setSelectedPeriod(initialPeriod);
    }
  }, [initialPeriod, selectedPeriod]);
  
  // Calculate progress date whenever period or project start date changes
  useEffect(() => {
    if (projectStartDate && selectedPeriod !== null) {
      const startDate = new Date(projectStartDate);
      const newProgressDate = new Date(startDate);
      newProgressDate.setDate(startDate.getDate() + (selectedPeriod * 7)); // Add weeks
      setProgressDate(newProgressDate);
    }
  }, [selectedPeriod, projectStartDate]);

  // Handle period increment/decrement
  const incrementPeriod = () => handlePeriodChange(true);
  const decrementPeriod = () => handlePeriodChange(false);
  
  // Private helper function
  const handlePeriodChange = (increment: boolean) => {
    if (selectedPeriod !== null) {
      setSelectedPeriod(prevPeriod => {
        if (!increment && (prevPeriod === null || prevPeriod <= 0)) {
          // Don't allow decrements below 0
          return 0;
        }
        return prevPeriod !== null ? prevPeriod + (increment ? 1 : -1) : null;
      });
    }
  };
  
  return {
    selectedPeriod,
    progressDate,
    incrementPeriod,
    decrementPeriod,
    setSelectedPeriod // Allow direct setting if needed
  };
};
