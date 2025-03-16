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

// Create ODataStore for Areas lookup with project filtering
const createAreaStore = (projectId: string) => {
  if (!projectId) {
    console.error('No projectId provided for Areas lookup');
    return null;
  }
  
  return new ODataStore({
    url: `${API_CONFIG.baseUrl}/odata/v1/Areas`,
    version: 4,
    key: 'guid',
    keyType: 'Guid',
    fieldTypes: {
      projectGuid: 'Guid'
    },
    beforeSend: (options: any) => {
      // Add filter for projectGuid using the standard approach
      if (options.url.indexOf('$filter') === -1) {
        options.url += options.url.indexOf('?') > -1 ? '&' : '?';
        options.url += `$filter=projectGuid eq ${projectId}`;
      } else {
        options.url += ` and projectGuid eq ${projectId}`;
      }

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

// Create columns with projectId parameter to filter areas
export const createDeliverableColumns = (projectId: string): ODataGridColumn[] => {
  const areaStore = createAreaStore(projectId);
  
  return [
    {
      dataField: 'clientNumber',
      caption: 'Client No.',
      hidingPriority: 0,
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'projectNumber',
      caption: 'Project No.',
      hidingPriority: 1,
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'areaNumber',
      caption: 'Area No.',
      hidingPriority: 2,
      lookup: areaStore ? {
        dataSource: areaStore,
        valueExpr: 'number',
        displayExpr: item => item ? `${item.number} - ${item.description}` : ''
      } : undefined
    },
    {
      dataField: 'discipline',
      caption: 'Discipline',
      hidingPriority: 3,
      lookup: {
        dataSource: disciplineStore,
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'documentType',
      caption: 'Document Type',
      hidingPriority: 4,
      lookup: {
        dataSource: documentTypeStore,
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'departmentId',
      caption: 'Department',
      hidingPriority: 5,
      lookup: {
        dataSource: departmentEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'deliverableTypeId',
      caption: 'Deliverable Type',
      hidingPriority: 12,
      lookup: {
        dataSource: deliverableTypeEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'internalDocumentNumber',
      caption: 'Internal Doc. No.',
      hidingPriority: 14 // Will be hidden last
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Doc. No.',
      hidingPriority: 7
    },
    {
      dataField: 'documentTitle',
      caption: 'Document Title',
      hidingPriority: 11  // Moved higher priority
    },
    {
      dataField: 'budgetHours',
      caption: 'Budget Hours',
      hidingPriority: 8
    },
    {
      dataField: 'variationHours',
      caption: 'Variation Hours',
      hidingPriority: 9
    },
    {
      dataField: 'totalHours',
      caption: 'Total Hours',
      hidingPriority: 13, // Will be hidden almost last
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'bookingCode',
      caption: 'Booking Code',
      hidingPriority: 6,
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    }
  ];
};
