import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { API_CONFIG } from '../../config/api';
import ODataStore from 'devextreme/data/odata/store';

const departmentStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/Departments`,
  version: 4,
  key: 'guid',
  keyType: 'Guid',
  beforeSend: (options: any) => {
    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : null;
    if (!token) return false;
    
    options.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
    return true;
  }
});

const deliverableTypeStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/DeliverableTypes`,
  version: 4,
  key: 'guid',
  keyType: 'Guid',
  beforeSend: (options: any) => {
    const token = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : null;
    if (!token) return false;
    
    options.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
    return true;
  }
});

export const deliverableColumns: ODataGridColumn[] = [
  {
    dataField: 'areaNumber',
    caption: 'Area No.',
    hidingPriority: 0
  },
  {
    dataField: 'discipline',
    caption: 'Discipline',
    hidingPriority: 1
  },
  {
    dataField: 'documentType',
    caption: 'Document Type',
    hidingPriority: 2
  },
  {
    dataField: 'departmentId',
    caption: 'Department',
    hidingPriority: 3,
    lookup: {
      dataSource: departmentStore,
      valueExpr: 'guid',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'deliverableTypeId',
    caption: 'Deliverable Type',
    hidingPriority: 4,
    lookup: {
      dataSource: deliverableTypeStore,
      valueExpr: 'guid',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'internalDocumentNumber',
    caption: 'Internal Doc. No.',
    hidingPriority: 11  // Will be hidden last
  },
  {
    dataField: 'clientDocumentNumber',
    caption: 'Client Doc. No.',
    hidingPriority: 5
  },
  {
    dataField: 'documentTitle',
    caption: 'Document Title',
    hidingPriority: 10  // Will be hidden second to last
  },
  {
    dataField: 'budgetHours',
    caption: 'Budget Hours',
    hidingPriority: 6
  },
  {
    dataField: 'variationHours',
    caption: 'Variation Hours',
    hidingPriority: 7
  },
  {
    dataField: 'totalCost',
    caption: 'Total Cost',
    hidingPriority: 8
  },
  {
    dataField: 'bookingCode',
    caption: 'Booking Code',
    hidingPriority: 9
  }
];
