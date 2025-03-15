import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { projectStatuses } from './project-statuses';
import ODataStore from 'devextreme/data/odata/store';
import { API_CONFIG } from '../../config/api';
import React from 'react';

// Create a singleton ODataStore for Client lookup
const clientStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/Clients`,
  version: 4,
  key: 'guid',
  keyType: 'Guid',
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

export const projectColumns: ODataGridColumn[] = [
  { 
    dataField: 'projectNumber', 
    caption: 'Project #', 
    hidingPriority: 2 
  },
  { 
    dataField: 'clientGuid', 
    caption: 'Client', 
    hidingPriority: 3,
    lookup: {
      dataSource: clientStore,
      valueExpr: 'guid',
      displayExpr: (item: any) => item ? `${item.number} - ${item.description}` : ''
    }
  },
  { 
    dataField: 'name', 
    caption: 'Name', 
    hidingPriority: 8 
  },
  {
    dataField: 'clientContactName',
    caption: 'Client Contact',
    hidingPriority: 5,
    allowEditing: false,
    cellRender: (cellData: any) => {
      const value = cellData.value;
      if (value) {
        return value;
      } else {
        // We'll add the transparency with CSS through the class name
        return React.createElement('div', { 
          className: 'placeholder-text',
          style: { opacity: 0.5 }
        }, 'Will display contact information after saving with selected client');
      }
    }
  },
  { 
    dataField: 'purchaseOrderNumber', 
    caption: 'PO #', 
    hidingPriority: 6 
  },
  {
    dataField: 'projectStatus',
    caption: 'Status',
    hidingPriority: 4,
    lookup: {
      dataSource: projectStatuses,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 9,
    allowEditing: false // Read-only field
  }
];
