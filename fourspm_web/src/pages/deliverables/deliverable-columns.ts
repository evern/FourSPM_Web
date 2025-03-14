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

// DeliverableType is now an enum, so we define the lookup values here
const deliverableTypeEnum = [
  { id: 0, name: 'Type 0' },
  { id: 1, name: 'Type 1' },
  { id: 2, name: 'Type 2' },
  { id: 3, name: 'Type 3' },
  { id: 4, name: 'Type 4' }
  // Add more enum values as needed based on your backend enum
];

export const deliverableColumns: ODataGridColumn[] = [
  {
    dataField: 'clientNumber',
    caption: 'Client No.',
    hidingPriority: 0,
    allowEditing: false // Read-only field
  },
  {
    dataField: 'projectNumber',
    caption: 'Project No.',
    hidingPriority: 0,
    allowEditing: false // Read-only field
  },
  {
    dataField: 'areaNumber',
    caption: 'Area No.',
    hidingPriority: 1
  },
  {
    dataField: 'discipline',
    caption: 'Discipline',
    hidingPriority: 2
  },
  {
    dataField: 'documentType',
    caption: 'Document Type',
    hidingPriority: 3
  },
  {
    dataField: 'departmentId',
    caption: 'Department',
    hidingPriority: 4,
    lookup: {
      dataSource: departmentStore,
      valueExpr: 'guid',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'deliverableTypeId',
    caption: 'Deliverable Type',
    hidingPriority: 5,
    lookup: {
      dataSource: deliverableTypeEnum,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'internalDocumentNumber',
    caption: 'Internal Doc. No.',
    hidingPriority: 12,  // Will be hidden last
    allowEditing: false  // Read-only field as it's now server-calculated
  },
  {
    dataField: 'clientDocumentNumber',
    caption: 'Client Doc. No.',
    hidingPriority: 6
  },
  {
    dataField: 'documentTitle',
    caption: 'Document Title',
    hidingPriority: 11  // Will be hidden second to last
  },
  {
    dataField: 'budgetHours',
    caption: 'Budget Hours',
    hidingPriority: 7
  },
  {
    dataField: 'variationHours',
    caption: 'Variation Hours',
    hidingPriority: 8
  },
  {
    dataField: 'totalHours',
    caption: 'Total Hours',
    hidingPriority: 8,
    allowEditing: false // Read-only field
  },
  {
    dataField: 'totalCost',
    caption: 'Total Cost',
    hidingPriority: 9
  },
  {
    dataField: 'bookingCode',
    caption: 'Booking Code',
    hidingPriority: 10,
    allowEditing: false // Read-only field
  }
];
