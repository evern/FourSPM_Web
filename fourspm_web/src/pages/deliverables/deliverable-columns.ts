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
      // Add filter for projectGuid using proper OData syntax
      const baseUrl = options.url.split('?')[0];
      const params = new URLSearchParams(options.url.split('?')[1] || '');
      
      // Get existing filter if any
      let filter = params.get('$filter') || '';
      
      // Add project filter
      const projectFilter = `projectGuid eq ${projectId}`;
      
      // Combine filters
      if (filter) {
        filter = `${filter} and ${projectFilter}`;
      } else {
        filter = projectFilter;
      }
      
      // Set the filter
      params.set('$filter', filter);
      
      // Reconstruct the URL
      options.url = `${baseUrl}?${params.toString()}`;

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
      hidingPriority: 3,
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'projectNumber',
      caption: 'Project No.',
      hidingPriority: 4,
      allowEditing: false, // Read-only field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'areaNumber',
      caption: 'Area No.',
      hidingPriority: 5,
      lookup: areaStore ? {
        dataSource: areaStore,
        valueExpr: 'number',
        displayExpr: item => item ? `${item.number} - ${item.description}` : ''
      } : undefined
    },
    {
      dataField: 'discipline',
      caption: 'Discipline',
      hidingPriority: 6,
      lookup: {
        dataSource: disciplineStore,
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'documentType',
      caption: 'Document Type',
      hidingPriority: 0,
      lookup: {
        dataSource: documentTypeStore,
        valueExpr: 'code',
        displayExpr: 'code'
      }
    },
    {
      dataField: 'departmentId',
      caption: 'Department',
      hidingPriority: 1,
      lookup: {
        dataSource: departmentEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'deliverableTypeId',
      caption: 'Deliverable Type',
      hidingPriority: 2,
      lookup: {
        dataSource: deliverableTypeEnum,
        valueExpr: 'id',
        displayExpr: 'name'
      }
    },
    {
      dataField: 'internalDocumentNumber',
      caption: 'Internal Doc. No.',
      hidingPriority: 14 // Will be hidden last (identifier)
    },
    {
      dataField: 'clientDocumentNumber',
      caption: 'Client Doc. No.',
      hidingPriority: 13 // Near last (identifier)
    },
    {
      dataField: 'documentTitle',
      caption: 'Document Title',
      hidingPriority: 12  // Will be hidden after metadata but before identifiers (name)
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
      hidingPriority: 9,
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    },
    {
      dataField: 'bookingCode',
      caption: 'Booking Code',
      hidingPriority: 11, // Higher hiding priority (identifier, but not the main one)
      allowEditing: false, // Read-only calculated field
      cellClass: 'faded-placeholder'
    }
  ];
};
