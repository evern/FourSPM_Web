import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { projectStatuses } from './project-statuses';
import ODataStore from 'devextreme/data/odata/store';
import { API_CONFIG } from '../../config/api';

// Create ODataStore for Client lookup
const createClientStore = () => {
  return new ODataStore({
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
};

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
      dataSource: { store: createClientStore() },
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
