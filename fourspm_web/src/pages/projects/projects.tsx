import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../../config/api';
import DataGrid, { Column, Paging, Pager, FilterRow, Lookup } from 'devextreme-react/data-grid';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { projectStatuses } from './project-statuses';

interface User {
  email: string;
  token: string;
}

const Projects: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get token from user object in localStorage
    const userJson = localStorage.getItem('user');
    
    if (!userJson) {
      console.log('No user found, redirecting to login...');
      window.location.href = '/login';
      return;
    }

    try {
      const user: User = JSON.parse(userJson);
      
      if (!user.token) {
        console.log('No token in user object, redirecting to login...');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      setToken(user.token);
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }, []);

  const store = new ODataStore({
    url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.projects}`,
    version: 4,
    key: 'guid',
    keyType: 'String',
    beforeSend: (options: any) => {
      if (!token) {
        console.log('No token available in beforeSend');
        return;
      }

      // Add authentication header
      options.headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      const originalSuccess = options.success;
      options.success = (data: any) => {
        console.log('Projects Data:', data.value);
        if (originalSuccess) {
          originalSuccess(data);
        }
      };
      
      console.log('Sending request to Projects API');
    },
    errorHandler: (error: any) => {
      console.error('Store Error:', error);
      
      // Don't treat empty results as an error
      if (error.httpStatus === 200 || error.httpStatus === 204) {
        console.log('Received successful response with no data');
        return false;
      }

      const errorMessage = error.message || 'An error occurred while fetching data';
      console.error('Error details:', {
        message: errorMessage,
        status: error.status,
        httpStatus: error.httpStatus,
        response: error.response,
        data: error.data
      });

      if (error.response?.status === 401 || errorMessage === 'Invalid or expired token') {
        console.log('Token invalid, redirecting to login...');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return true;
      }
      
      setError(`Error: ${errorMessage}. Status: ${error.httpStatus || error.status || 'unknown'}`);
      return true;
    }
  });

  const dataSource = new DataSource({
    store,
    expand: [],
    select: [
      'guid',
      'projectNumber',
      'clientNumber',
      'name',
      'clientContact',
      'purchaseOrderNumber',
      'projectStatus',
      'created'
    ],
    map: function(item) {
      // Log the item for debugging
      console.log('Mapping item:', item);
      return item;
    }
  });

  if (!token) {
    console.log('Rendering loading state...');
    return <div>Loading... (No token available)</div>;
  }

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="error-message" style={{ padding: '20px', color: 'red' }}>
        {error}
        <br />
        <button 
          onClick={() => {
            setError(null);
            dataSource.reload();
          }}
          style={{ marginTop: '10px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Projects</h2>
      <DataGrid
        dataSource={dataSource}
        showBorders={true}
        remoteOperations={true}
        height="100%"
        noDataText="No projects found. Create a new project to get started."
      >
        <Column dataField="projectNumber" caption="Project #" />
        <Column dataField="clientNumber" caption="Client #" />
        <Column 
          dataField="name" 
          caption="Project Name"
          calculateDisplayValue={(data: any) => data.name || '-'}
        />
        <Column dataField="clientContact" caption="Client Contact" />
        <Column dataField="purchaseOrderNumber" caption="PO #" />
        <Column
          dataField="projectStatus"
          caption="Status"
        >
          <Lookup
            dataSource={projectStatuses}
            valueExpr="id"
            displayExpr="name"
          />
        </Column>
        <Column dataField="created" caption="Created Date" dataType="date" />
        <FilterRow visible={true} />
        <Paging defaultPageSize={10} />
        <Pager
          showPageSizeSelector={true}
          allowedPageSizes={[5, 10, 20]}
          showInfo={true}
        />
      </DataGrid>
    </div>
  );
};

export default Projects;
