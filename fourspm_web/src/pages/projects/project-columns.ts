import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { projectStatuses } from './project-statuses';
import ODataStore from 'devextreme/data/odata/store';
import { API_CONFIG } from '../../config/api';
import React from 'react';

// Constants for reusable text
const CLIENT_CONTACT_PLACEHOLDER = 'Auto-filled on client selection';

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
    hidingPriority: 8 
  },
  { 
    dataField: 'clientGuid', 
    caption: 'Client', 
    hidingPriority: 5,
    lookup: {
      dataSource: clientStore,
      valueExpr: 'guid',
      displayExpr: (item: any) => item ? `${item.number} - ${item.description}` : ''
    }
  },
  { 
    dataField: 'name', 
    caption: 'Name', 
    hidingPriority: 9 
  },
  {
    dataField: 'clientContactName',
    caption: 'Client Contact',
    hidingPriority: 4,
    allowEditing: false, 
    customizeText: (cellInfo: { value: string | null }) => {
      return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
    },
    cellClass: 'faded-placeholder'
  },
  {
    dataField: 'clientContactNumber',
    caption: 'Contact Number',
    hidingPriority: 2,
    allowEditing: false, 
    customizeText: (cellInfo: { value: string | null }) => {
      return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
    },
    cellClass: 'faded-placeholder'
  },
  {
    dataField: 'clientContactEmail',
    caption: 'Contact Email',
    hidingPriority: 3,
    allowEditing: false, 
    customizeText: (cellInfo: { value: string | null }) => {
      return cellInfo.value || CLIENT_CONTACT_PLACEHOLDER;
    },
    cellClass: 'faded-placeholder'
  },
  { 
    dataField: 'purchaseOrderNumber', 
    caption: 'PO #', 
    hidingPriority: 7 
  },
  {
    dataField: 'projectStatus',
    caption: 'Status',
    hidingPriority: 6,
    lookup: {
      dataSource: projectStatuses,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'created',
    caption: 'Created',
    hidingPriority: 0, 
    cellClass: 'faded-placeholder',
    allowEditing: false 
  }
];
