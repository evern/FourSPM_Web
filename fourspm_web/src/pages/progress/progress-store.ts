import { API_CONFIG } from '../../config/api';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { v4 as uuidv4 } from 'uuid';

// Create a custom ODataStore that handles progress tracking updates
export const createProgressDataSource = (projectId: string, periodId: number) => {
  if (!projectId) {
    console.error('No projectId provided for Progress data source');
    return null;
  }
  
  const store = new ODataStore({
    url: `${API_CONFIG.baseUrl}/odata/v1/Deliverables`,
    key: 'guid',
    keyType: 'Guid',
    version: 4,
    deserializeDates: true,
    beforeSend: (options: any) => {
      const token = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user') || '{}').token : null;
      
      if (!token) {
        console.error('No token available');
        return false;
      }

      options.headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      return true;
    }
  });
  
  // Override the default update method with our custom function
  (store as any).update = (key: string, values: any) => {
    return handleProgressUpdate(key, values, periodId);
  };

  return new DataSource({
    store: store,
    filter: ['projectGuid', '=', projectId],
    expand: ['progressItems']
  });
};

// Export the function that handles progress updates
export const handleProgressUpdate = (key: string, values: any, periodId: number, originalData?: any) => {
  console.log('Handling progress update:', key, values, periodId);
  console.log('Original data structure:', originalData);
  
  // Only process if we have totalPercentageEarnt update
  if (values.totalPercentageEarnt !== undefined) {
    // Get token from local storage
    const token = localStorage.getItem('user') ? 
      JSON.parse(localStorage.getItem('user') || '{}').token : null;
    
    if (!token) {
      console.error('No token available');
      return Promise.reject('No authentication token available');
    }
    
    // Ensure value is between 0 and 1 (decimal percentage)
    let percentValue = values.totalPercentageEarnt;
    percentValue = Math.max(0, Math.min(1, percentValue));
    
    // Get total hours from original data or current data
    const totalHours = (originalData && originalData.totalHours) || values.totalHours || 0;
    if (totalHours <= 0) {
      console.warn('Invalid totalHours value:', totalHours);
      return Promise.reject('Invalid total hours value');
    }

    // Calculate the total units based on the new percentage
    const totalUnits = percentValue * totalHours;
    
    // Get previous periods' units
    let previousPeriodsUnits = 0;
    if (originalData && originalData.progressItems) {
      // Sum up units from all periods BEFORE the current one
      previousPeriodsUnits = originalData.progressItems
        .filter((p: any) => p.period < periodId)
        .reduce((sum: number, item: any) => sum + (item.units || 0), 0);
    }
    
    // Calculate units for current period: total units - previous periods units
    const currentPeriodUnits = Math.max(0, totalUnits - previousPeriodsUnits);
    
    console.log('Calculation details:', {
      percentValue,
      totalHours,
      totalUnits,
      previousPeriodsUnits,
      currentPeriodUnits
    });
    
    // Create a progress entity to add or update
    const progressEntity = {
      guid: uuidv4(), // Generate a valid UUID on the client side
      deliverableGuid: key,
      period: periodId,
      units: currentPeriodUnits
    };
      
    // Use the new AddOrUpdateExisting endpoint
    return fetch(`${API_CONFIG.baseUrl}/odata/v1/Progress/AddOrUpdateExisting`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(progressEntity)
    }).then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(`Failed to update progress: ${text}`);
        });
      }
      return response.json();
    });
  }
  
  // For other updates, let the default handler work
  return Promise.resolve();
};
