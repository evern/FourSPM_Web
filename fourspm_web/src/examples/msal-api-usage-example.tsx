import React, { useEffect, useState, useCallback } from 'react';
import { useApiService } from '../hooks/useApiService';
import LoadPanel from 'devextreme-react/load-panel';

/**
 * Example component demonstrating how to use the MSAL-integrated API service
 * This component shows the proper pattern for making authenticated API calls
 */
const ApiUsageExample: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use our new API service hook
  const { get, post } = useApiService();
  
  // Example of fetching data with the new API service
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get request example
      const response = await get('/api/v1/data');
      
      if (response.isOk && response.data) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Example of submitting data
  const handleSubmit = useCallback(async (formData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Post request example
      const response = await post('/api/v1/data', formData);
      
      if (response.isOk) {
        // Handle successful submission
        console.log('Data submitted successfully');
        // Refresh data after successful submission
        await fetchData();
      } else {
        setError(response.message || 'Failed to submit data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error submitting data:', err);
    } finally {
      setLoading(false);
    }
  }, [post, fetchData]);
  
  return (
    <div className="api-example">
      <h2>API Usage Example</h2>
      
      {loading && <LoadPanel visible={true} />}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {data && (
        <div className="data-container">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
      
      <div className="form-container">
        <button 
          className="dx-button dx-button-mode-contained dx-button-normal"
          onClick={() => handleSubmit({ example: 'data' })}
        >
          Submit Example Data
        </button>
      </div>
    </div>
  );
};

export default ApiUsageExample;
