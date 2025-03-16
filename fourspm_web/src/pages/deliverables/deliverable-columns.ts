import { ODataGridColumn } from '../../components/ODataGrid/ODataGrid';
import { API_CONFIG } from '../../config/api';
import ODataStore from 'devextreme/data/odata/store';

// Department is now an enum, so we define the lookup values here
const departmentEnum = [
  { id: 'Administration', name: 'Administration' },
  { id: 'Design', name: 'Design' },
  { id: 'Engineering', name: 'Engineering' },
  { id: 'Management', name: 'Management' }
];

// DeliverableType is now an enum, so we define the lookup values here
const deliverableTypeEnum = [
  { id: 'Task', name: 'Task' },
  { id: 'NonDeliverable', name: 'Non Deliverable' },
  { id: 'DeliverableICR', name: 'Deliverable ICR' },
  { id: 'Deliverable', name: 'Deliverable' }
];

// Create ODataStore for DocumentType lookup
const documentTypeStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/DocumentTypes`,
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

// Create ODataStore for Discipline lookup
const disciplineStore = new ODataStore({
  url: `${API_CONFIG.baseUrl}/odata/v1/Disciplines`,
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

export const deliverableColumns: ODataGridColumn[] = [
  {
    dataField: 'project.client.number',
    caption: 'Client No.',
    hidingPriority: 13,
    allowEditing: false, // Read-only field
    cellClass: 'faded-placeholder'
  },
  {
    dataField: 'projectNumber',
    caption: 'Project No.',
    hidingPriority: 12,
    allowEditing: false, // Read-only field
    cellClass: 'faded-placeholder'
  },
  {
    dataField: 'areaNumber',
    caption: 'Area No.',
    hidingPriority: 11
  },
  {
    dataField: 'discipline',
    caption: 'Discipline',
    hidingPriority: 10,
    lookup: {
      dataSource: disciplineStore,
      valueExpr: 'code',
      displayExpr: 'code'
    }
  },
  {
    dataField: 'documentType',
    caption: 'Document Type',
    hidingPriority: 9,
    lookup: {
      dataSource: documentTypeStore,
      valueExpr: 'code',
      displayExpr: 'code'
    }
  },
  {
    dataField: 'departmentId',
    caption: 'Department',
    hidingPriority: 8,
    lookup: {
      dataSource: departmentEnum,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'deliverableTypeId',
    caption: 'Deliverable Type',
    hidingPriority: 1,
    lookup: {
      dataSource: deliverableTypeEnum,
      valueExpr: 'id',
      displayExpr: 'name'
    }
  },
  {
    dataField: 'internalDocumentNumber',
    caption: 'Internal Doc. No.',
    hidingPriority: 0 // Will be hidden first
  },
  {
    dataField: 'clientDocumentNumber',
    caption: 'Client Doc. No.',
    hidingPriority: 6
  },
  {
    dataField: 'documentTitle',
    caption: 'Document Title',
    hidingPriority: 2  // Will be hidden early
  },
  {
    dataField: 'budgetHours',
    caption: 'Budget Hours',
    hidingPriority: 5
  },
  {
    dataField: 'variationHours',
    caption: 'Variation Hours',
    hidingPriority: 4
  },
  {
    dataField: 'totalHours',
    caption: 'Total Hours',
    hidingPriority: 3,
    allowEditing: false, // Read-only calculated field
    cellClass: 'faded-placeholder'
  },
  {
    dataField: 'bookingCode',
    caption: 'Booking Code',
    hidingPriority: 7,
    allowEditing: false, // Read-only calculated field
    cellClass: 'faded-placeholder'
  }
];
