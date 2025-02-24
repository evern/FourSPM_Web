import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '../../config/api';
import DataGrid, { Column, Paging, Pager, FilterRow, Lookup } from 'devextreme-react/data-grid';
import ODataStore from 'devextreme/data/odata/store';
import DataSource from 'devextreme/data/data_source';
import { projectStatuses } from './project-statuses';
import { v4 as uuidv4 } from 'uuid';

interface User {
  email: string;
  token: string;
}

interface UpdateData {
  projectStatus?: string;
  clientNumber?: string;
  projectNumber?: string;
  name?: string;
  clientContact?: string;
}

const Projects: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextProjectNumber, setNextProjectNumber] = useState<string>('01');
  const gridRef = React.useRef<any>(null);

  const getNextProjectNumber = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects?$orderby=projectNumber desc&$top=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch latest project number');
      }

      const data = await response.json();
      const projects = data.value || [];
      
      if (projects.length === 0) {
        return '01'; // Start with 01 if no projects exist
      }

      const lastProjectNumber = projects[0].projectNumber;
      const nextNumber = parseInt(lastProjectNumber, 10) + 1;
      return nextNumber.toString().padStart(2, '0'); // Ensure 2 digits with leading zero
    } catch (error) {
      console.error('Error getting next project number:', error);
      return '01'; // Fallback to 01 if there's an error
    }
  };

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

  useEffect(() => {
    if (token) {
      getNextProjectNumber().then(number => setNextProjectNumber(number));
    }
  }, [token]);

  // Log token state early
  console.log('Token state:', {
    exists: !!token,
    length: token?.length,
    preview: token ? `${token.substring(0, 10)}...` : 'none'
  });

  const store = new ODataStore({
    url: `${API_CONFIG.baseUrl}/odata/v1/Projects`,
    version: 4,
    key: 'guid',
    keyType: 'Guid',
    onUpdating: (key, values) => {
      console.log('%c OnUpdating called with:', 'background: #222; color: #bada55');
      console.log('Key:', key);
      console.log('Values:', values);

      // Create a clean update object with only non-null/undefined values
      const updateData = {};
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          updateData[key] = values[key];
        }
      });

      console.log('%c Clean update data:', 'background: #222; color: #bada55', updateData);
      return updateData;
    },
    beforeSend: (options: any) => {
      console.log('%c BeforeSend called with:', 'background: #222; color: #bada55', options);
      
      if (!token) {
        console.error('No token available');
        return false;
      }

      // Set proper OData headers
      options.headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };
      
      if (options.method === 'PATCH') {
        // Extract GUID from URL
        const matches = options.url.match(/Projects\(([\w-]+)\)/);
        const guid = matches ? matches[1] : null;

        if (!guid) {
          console.error('No GUID found in URL');
          return false;
        }

        // Get the patch data from the appropriate location
        const patchData = options.data || options.payload || (options.params?.values);

        if (!patchData || Object.keys(patchData).length === 0) {
          console.error('No data provided for PATCH request');
          return false;
        }

        console.log('%c Raw patch data:', 'background: #ff0000; color: #ffffff', patchData);

        // Keep the GUID in the URL as required by the controller
        const baseUrl = API_CONFIG.baseUrl.replace(/\/$/, '');
        options.url = `${baseUrl}/odata/v1/Projects(${guid})`;

        // Clean the data by removing undefined/null values
        const cleanPatchData = {};
        Object.keys(patchData).forEach(key => {
          if (patchData[key] !== undefined && patchData[key] !== null) {
            cleanPatchData[key] = patchData[key];
          }
        });

        // Set the data back to options
        options.data = cleanPatchData;

        // Set proper OData headers
        options.headers['Content-Type'] = 'application/json;odata.metadata=minimal;odata.streaming=true';
        options.headers['Accept'] = 'application/json';
        options.headers['Prefer'] = 'return=minimal';

        // Log everything about the request
        console.log('%c Final PATCH request details:', 'background: #222; color: #bada55', {
          url: options.url,
          method: options.method,
          headers: options.headers,
          data: cleanPatchData
        });

        // Log the exact payload being sent
        console.log('%c Request payload:', 'background: #ff0000; color: #ffffff', 
          JSON.stringify(cleanPatchData, null, 2));
      }

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
    ]
  });

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const response = await fetch(`${API_CONFIG.baseUrl}/odata/v1/Projects(${projectId})`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          // Refresh project list after successful deletion
          dataSource.reload();
          alert('Project deleted successfully');
        } else {
          throw new Error('Failed to delete project');
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Error deleting project');
      }
    }
  };

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
    <React.Fragment>
      <h2 className={'content-block'}>Projects</h2>
      <DataGrid
        className={'dx-card wide-card'}
        ref={gridRef}
        dataSource={dataSource}
        showBorders={false}
        focusedRowEnabled={true}
        defaultFocusedRowIndex={0}
        columnAutoWidth={true}
        columnHidingEnabled={true}
        remoteOperations={true}
        height={600}
        noDataText="No projects found. Create a new project to get started."
        editing={{
          mode: 'row',
          allowAdding: true,
          allowUpdating: true,
          allowDeleting: true,
          useIcons: true,
          newRowPosition: 'pageTop',
          texts: {
            saveRowChanges: 'Save',
            cancelRowChanges: 'Cancel',
            editRow: 'Edit',
            deleteRow: 'Delete'
          }
        }}
        onInitNewRow={(e) => {
          e.data = {
            guid: uuidv4(),
            projectNumber: nextProjectNumber
          };
          getNextProjectNumber().then(number => setNextProjectNumber(number));
        }}
        onRowUpdating={(e) => {
          const guid = e.oldData.guid;
          // Log the full event object
          console.log('Row updating event (full):', e);
          console.log('Row updating newData:', e.newData);

          // Ensure we're working with actual changed values
          const updateData: UpdateData = {};
          Object.keys(e.newData || {}).forEach(key => {
            if (e.newData[key] !== undefined && e.newData[key] !== null) {
              updateData[key as keyof UpdateData] = e.newData[key];
            }
          });

          console.log('Cleaned update data:', updateData);
          e.newData = updateData;
        }}
        onRowValidating={(e) => {
          if (e.isValid) {
            const data = e.newData;
            
            if (e.oldData) {
              Object.assign(data, { ...e.oldData, ...data });
            }

            if (!data.clientNumber || !data.projectNumber) {
              e.isValid = false;
              e.errorText = 'Client Number and Project Number are required';
              return;
            }

            if (data.clientNumber.length > 3) {
              e.isValid = false;
              e.errorText = 'Client Number must be at most 3 characters';
              return;
            }

            if (data.projectNumber.length > 2) {
              e.isValid = false;
              e.errorText = 'Project Number must be at most 2 characters';
              return;
            }
          }
        }}
        onRowRemoving={(e) => {
          handleDeleteProject(e.data.guid);
        }}
      >
        <Paging defaultPageSize={10} />
        <Pager showPageSizeSelector={true} showInfo={true} />
        <FilterRow visible={true} />

        <Column dataField="projectNumber" caption="Project #" hidingPriority={2} />
        <Column dataField="clientNumber" caption="Client #" hidingPriority={3} />
        <Column dataField="name" caption="Name" hidingPriority={8} />
        <Column dataField="clientContact" caption="Client Contact" hidingPriority={5} />
        <Column dataField="projectStatus" caption="Status" hidingPriority={4}>
          <Lookup
            dataSource={projectStatuses}
            valueExpr="value"
            displayExpr="name"
          />
        </Column>
      </DataGrid>
    </React.Fragment>
  );
};

export default Projects;
