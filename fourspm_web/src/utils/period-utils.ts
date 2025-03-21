/**
 * Calculate the current reporting period based on project start date
 * @param progressStart The project's progress start date
 * @returns The current period number
 */
export const calculateCurrentPeriod = (progressStart: Date): number => {
  // Calculate months between start date and now
  const now = new Date();
  const startYear = progressStart.getFullYear();
  const startMonth = progressStart.getMonth();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  // Calculate the difference in months
  const monthsDiff = (currentYear - startYear) * 12 + (currentMonth - startMonth);
  
  // Add 1 to get the period number (1-based)
  return monthsDiff + 1;
};
